import base64
import os
import secrets
from datetime import datetime
from typing import List, Optional
from firebase_admin import firestore
from pydantic import BaseModel, Field

class PollOptionInput(BaseModel):
    label: str

class CreatePollData(BaseModel):
    title: str
    description: Optional[str] = None
    type: str = "single"  # single or multi
    visibility: str = "public"  # public or private
    resultsVisibility: str = "always"  # always or after_voting
    options: List[str]
    allowedEmails: Optional[List[str]] = []
    endAt: Optional[str] = None # ISO format string

def create_poll_db_tool(
    title: str,
    options: List[str],
    userId: str,
    creatorName: str,
    description: Optional[str] = None,
    type: str = "single",
    visibility: str = "public",
    resultsVisibility: str = "always",
    allowedEmails: Optional[List[str]] = None,
    endAt: Optional[str] = None
) -> str:
    """Creates a new poll in the Firestore database.

    Args:
        title: The title of the poll.
        options: A list of option labels (must have at least 2).
        userId: The UID of the creator.
        creatorName: The display name of the creator.
        description: Detailed context of the poll.
        type: Either 'single' or 'multi' choice.
        visibility: Either 'public' or 'private'.
        resultsVisibility: Either 'always' or 'after_voting'.
        allowedEmails: List of invited emails (for private visibility).
        endAt: ISO format end time of the poll (optional).
    """
    db = firestore.client()

    # Expiry parsing
    parsed_end = None
    if endAt:
        try:
            parsed_end = datetime.fromisoformat(endAt.replace("Z", "+00:00"))
        except Exception:
            pass

    # Normalize options
    db_options = []
    for idx, opt in enumerate(options):
        db_options.append({
            "id": secrets.token_hex(8),
            "label": opt.strip(),
            "order": idx,
            "voteCount": 0
        })

    share_token = secrets.token_urlsafe(16)

    # Normalize allowed emails
    norm_emails = []
    if visibility == "private" and allowedEmails:
        norm_emails = [e.strip().lower() for e in allowedEmails if e.strip()]

    poll_doc = {
        "title": title.strip(),
        "description": description.strip() if description else None,
        "type": type,
        "visibility": visibility,
        "resultsVisibility": resultsVisibility,
        "status": "draft",
        "shareToken": share_token,
        "creatorId": userId,
        "creatorName": creatorName,
        "endAt": parsed_end,
        "createdAt": firestore.SERVER_TIMESTAMP,
        "updatedAt": firestore.SERVER_TIMESTAMP,
        "totalRespondents": 0,
        "allowedEmails": norm_emails,
        "inviteeIds": [],
        "options": db_options
    }

    # Batch save poll + share token lookup
    batch = db.batch()
    poll_ref = db.collection("polls").document()
    token_ref = db.collection("shareTokens").document(share_token)

    batch.set(poll_ref, poll_doc)
    batch.set(token_ref, {"pollId": poll_ref.id})
    batch.commit()

    # Write audit log
    log_ref = db.collection("auditLogs").document()
    log_ref.set({
      "actorId": userId,
      "action": "create_poll_via_ai",
      "targetId": poll_ref.id,
      "timestamp": firestore.SERVER_TIMESTAMP,
      "metadata": {"title": title, "visibility": visibility}
    })

    return poll_ref.id

def query_polls_db_tool(query: str, userId: str) -> str:
    """Queries the database to search across visible polls.
    Supports future semantic/vector matching tags using search terms.

    Args:
        query: The search term or natural language description.
        userId: The UID of the requesting user.
    """
    db = firestore.client()

    # Fetch public polls and private polls where user is invited/creator
    public_polls = db.collection("polls").where("visibility", "==", "public").get()
    creator_polls = db.collection("polls").where("creatorId", "==", userId).get()
    invited_polls = db.collection("polls").where("inviteeIds", "array-contains", userId).get()

    all_polls = {}
    for doc in public_polls + creator_polls + invited_polls:
        # Deduplicate
        data = doc.to_dict()
        if data.get("status") == "draft" and data.get("creatorId") != userId:
            continue # Drafts hidden from non-creators
        all_polls[doc.id] = data

    # Perform keyword & semantic tags matching
    matches = []
    query_lower = query.lower()

    for pid, data in all_polls.items():
        title = data.get("title", "").lower()
        desc = (data.get("description") or "").lower()
        tags = [t.lower() for t in data.get("tags", [])]
        creator = data.get("creatorName", "").lower()

        # Simple semantic-hook ranking (e.g. checks text overlap)
        score = 0
        if query_lower in title:
            score += 10
        if query_lower in desc:
            score += 3
        if any(query_lower in t for t in tags):
            score += 5
        if query_lower in creator:
            score += 2

        if score > 0:
            matches.append((score, pid, data))

    # Sort matches by relevance score
    matches.sort(key=lambda x: x[0], reverse=True)

    result_str = f"Found {len(matches)} matching polls for query '{query}':\n"
    for _, pid, data in matches[:5]:
        status = data.get("status")
        creator = data.get("creatorName")
        total = data.get("totalRespondents", 0)
        result_str += f"- ID: {pid} | {data.get('title')} (Status: {status}, Creator: {creator}, Votes: {total})\n"

    return result_str
