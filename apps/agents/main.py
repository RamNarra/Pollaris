import os
import sys
from typing import Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Add parent directory to path to support imports if needed
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables from apps/web/.env.local
env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "web/.env.local")
if os.path.exists(env_path):
    load_dotenv(env_path)
else:
    load_dotenv()

import firebase_admin
from firebase_admin import credentials

# Add apps/agents directory to sys.path to resolve absolute imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Initialize Firebase Admin Python SDK
if not firebase_admin._apps:
    project_id = os.environ.get("NEXT_PUBLIC_FIREBASE_PROJECT_ID") or os.environ.get("FIREBASE_PROJECT_ID")
    client_email = os.environ.get("FIREBASE_CLIENT_EMAIL")
    private_key = os.environ.get("FIREBASE_PRIVATE_KEY")

    if private_key and client_email and project_id:
        try:
            # Reformat private key newlines and handle quotes/typos
            formatted_key = private_key.strip()
            if formatted_key.startswith('"') and formatted_key.endswith('"'):
                formatted_key = formatted_key[1:-1]
            formatted_key = formatted_key.replace("\\h", "\\nh")
            formatted_key = formatted_key.replace("\\n", "\n")

            cred = credentials.Certificate({
                "type": "service_account",
                "project_id": project_id,
                "private_key": formatted_key,
                "client_email": client_email,
                "token_uri": "https://oauth2.googleapis.com/token"
            })
            firebase_admin.initialize_app(cred)
            print(f"Firebase Admin initialized successfully for project {project_id}")
        except Exception as e:
            print(f"Error initializing Firebase with credentials: {e}", file=sys.stderr)
            firebase_admin.initialize_app()
    else:
        print("Firebase credentials missing, initializing with default application credentials.")
        firebase_admin.initialize_app()

from agents import run_agent_turn

app = FastAPI(title="Pollaris Agents API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatRequest(BaseModel):
    prompt: str
    agent_type: str = "creation"  # creation, search, analytics
    userId: str
    creatorName: str
    conversation_id: Optional[str] = None

class AnalyzeRequest(BaseModel):
    poll_id: str
    userId: str

@app.get("/health")
def health_check():
    return {"status": "ok", "firebase": len(firebase_admin._apps) > 0}

@app.post("/api/chat")
async def chat_endpoint(req: ChatRequest):
    try:
        res = await run_agent_turn(
            agent_type=req.agent_type,
            prompt=req.prompt,
            userId=req.userId,
            creatorName=req.creatorName,
            conversation_id=req.conversation_id
        )
        return res
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyze")
async def analyze_endpoint(req: AnalyzeRequest):
    try:
        from firebase_admin import firestore
        db = firestore.client()

        # Retrieve poll document
        poll_ref = db.collection("polls").document(req.poll_id)
        poll_doc = poll_ref.get()
        if not poll_doc.exists:
            raise HTTPException(status_code=404, detail="Poll not found")

        poll_data = poll_doc.to_dict()
        creator_id = poll_data.get("creatorId")
        if creator_id != req.userId:
            raise HTTPException(status_code=403, detail="Only creator can run analytics")

        # Retrieve votes and reasons
        votes_snap = poll_ref.collection("votes").get()
        votes_list = []
        reasons_list = []

        for vdoc in votes_snap:
            vdata = vdoc.to_dict()
            votes_list.append(vdata.get("selectedOptionIds", []))
            reason = vdata.get("reason")
            if reason:
                reasons_list.append(reason)

        # Build prompt for analytics agent
        prompt = f"""
Here is the poll structure and gathered results data:
Title: {poll_data.get('title')}
Description: {poll_data.get('description')}
Total Respondents: {poll_data.get('totalRespondents', 0)}
Options config & vote distribution:
{[{ 'id': o.get('id'), 'label': o.get('label'), 'votes': o.get('voteCount') } for o in poll_data.get('options', [])]}

Voter reasoning feedback:
{reasons_list}

Please perform executive analytics and sentiment review.
"""
        res = await run_agent_turn(
            agent_type="analytics",
            prompt=prompt,
            userId=req.userId,
            creatorName="",
            conversation_id=None
        )
        return {"analytics": res["text"]}
    except HTTPException as he:
        raise he
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
