import os
from typing import List, Optional
from google.antigravity import Agent, LocalAgentConfig
from google.antigravity.hooks import policy
from tools import create_poll_db_tool, query_polls_db_tool

# Directory to save conversation state natively
CONVERSATIONS_DIR = os.path.expanduser("~/.gemini/antigravity/brain/pollaris_chats")
os.makedirs(CONVERSATIONS_DIR, exist_ok=True)

class PollarisAgentOrchestrator:
    @staticmethod
    def get_creation_agent_config(
        userId: str,
        creatorName: str,
        conversation_id: Optional[str] = None
    ) -> LocalAgentConfig:
        """Returns config for the Poll Creation & Clarification Agent."""
        system_instructions = f"""You are the Pollaris Decision Orchestration Agent.
Your job is to assist user '{creatorName}' (UID: {userId}) in creating polls or gathering organizational input.

CRITICAL STEPS:
1. Parse the user's natural language request.
2. If there are missing fields or choices required to create a valid poll, ASK the user clarification questions.
   To create a poll, you need:
   - Title (required, descriptive)
   - Description (optional, context)
   - Options/Choices (at least 2 choices are REQUIRED)
   - Type ('single' or 'multi' choice)
   - Visibility ('public' or 'private')
   - Results visibility ('always' or 'after_voting')
   - Expiry endAt (optional, ISO format)
   - Allowed Emails list (only if visibility is private)
3. Do NOT make up options or settings. Ask the user for them if you are unsure.
4. Once you have sufficient details (e.g. at least Title, Options, and Type/Visibility settings), call the 'create_poll_db_tool' to persist the poll.
5. In your tool calls, you must pass the exact parameters provided by the user or resolved by you.
6. When calling 'create_poll_db_tool', pass '{userId}' for userId, and '{creatorName}' for creatorName.
7. Inform the user once the poll is successfully created.

All operations must strictly respect access controls and organization rules.
"""
        return LocalAgentConfig(
            model="gemini-3.5-flash",
            system_instructions=system_instructions,
            tools=[create_poll_db_tool],
            save_dir=CONVERSATIONS_DIR,
            conversation_id=conversation_id,
            policies=[policy.allow_all()] # Allow execution of database tools
        )

    @staticmethod
    def get_search_agent_config(
        userId: str,
        conversation_id: Optional[str] = None
    ) -> LocalAgentConfig:
        """Returns config for the Search Agent."""
        system_instructions = f"""You are the Pollaris Search Agent.
Your job is to help the user query and retrieve decisions and polls.
Call 'query_polls_db_tool' to search the database.
Always pass '{userId}' for userId in tool calls.
Synthesize the search results and present them cleanly to the user.
"""
        return LocalAgentConfig(
            model="gemini-3.5-flash",
            system_instructions=system_instructions,
            tools=[query_polls_db_tool],
            save_dir=CONVERSATIONS_DIR,
            conversation_id=conversation_id,
            policies=[policy.allow_all()]
        )

    @staticmethod
    def get_analytics_agent_config() -> LocalAgentConfig:
        """Returns config for the Analytics and Sentiment Agent."""
        system_instructions = """You are the Pollaris Analytics & Sentiment Agent.
You will be provided with a poll structure, vote distributions, and option comments/reasons left by voters.
Your job is to generate:
1. Executive summary of the decision outcome.
2. Voter participation analytics (voter engagement rate).
3. Sentiment analysis of the comments/reasons. Summarize why voters chose their respective options.
4. Anomaly detection (e.g. controversial options, high rate of vote replacements).

Format your response in structured markdown with bullet points and clear headings.
"""
        return LocalAgentConfig(
            model="gemini-3.5-flash",
            system_instructions=system_instructions,
            policies=[policy.confirm_run_command()]
        )

async def run_agent_turn(
    agent_type: str,
    prompt: str,
    userId: str,
    creatorName: str,
    conversation_id: Optional[str] = None
) -> dict:
    """Executes a single turn of conversation with the selected agent type."""
    if agent_type == "search":
        config = PollarisAgentOrchestrator.get_search_agent_config(userId, conversation_id)
    elif agent_type == "analytics":
        config = PollarisAgentOrchestrator.get_analytics_agent_config()
    else:
        config = PollarisAgentOrchestrator.get_creation_agent_config(userId, creatorName, conversation_id)

    async with Agent(config) as agent:
        response = await agent.chat(prompt)
        text = await response.text()
        return {
            "text": text,
            "conversation_id": agent.conversation_id
        }
