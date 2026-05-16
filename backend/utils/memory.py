# memory.py — Production conversation state management
#
# KEY FIXES:
# - Proper ConversationState class (was: module-level functions on a dict list)
# - Structured turn storage: question, answer, rewritten_query
# - get_formatted_history() returns LLM-ready string
# - get_last_topic() returns the rewritten (resolved) query, not raw question
# - Thread-safe by design (one instance per session)
# - MEMORY_WINDOW from config

from config import MEMORY_WINDOW


class ConversationState:
    """
    Manages conversation history for a single session.

    Each turn stored as:
        {
            "question": str,         # raw user question
            "rewritten_query": str,  # resolved/rewritten query used for retrieval
            "answer": str,           # final answer returned to user
        }
    """

    def __init__(self):
        self._history: list[dict] = []

    def add_turn(self, question: str, answer: str, rewritten_query: str = "") -> None:
        """Append a completed turn to history."""
        self._history.append({
            "question": question,
            "rewritten_query": rewritten_query or question,
            "answer": answer,
        })

    def get_recent_turns(self, n: int = MEMORY_WINDOW) -> list[dict]:
        """Return the last n turns."""
        return self._history[-n:]

    def get_formatted_history(self, n: int = MEMORY_WINDOW) -> str:
        """
        Return recent conversation as a formatted string for LLM prompt injection.

        Example output:
            User: What is Article 21?
            Assistant: Article 21 protects the right to life...

            User: Compare it with Article 32.
            Assistant: While Article 21 deals with...
        """
        recent = self.get_recent_turns(n)
        if not recent:
            return ""

        lines = []
        for turn in recent:
            lines.append(f"User: {turn['question']}")
            # Truncate very long answers in history to save tokens
            answer_snippet = turn["answer"][:400]
            if len(turn["answer"]) > 400:
                answer_snippet += "..."
            lines.append(f"Assistant: {answer_snippet}")
            lines.append("")  # blank line between turns

        return "\n".join(lines).strip()

    def get_last_topic(self) -> str | None:
        """
        Returns the rewritten query from the most recent turn.
        Use this for continuation resolution — it's the resolved topic, not the raw phrase.
        """
        if not self._history:
            return None
        return self._history[-1]["rewritten_query"]

    def get_last_answer(self) -> str | None:
        """Returns the most recent answer, for 'explain more about that' resolution."""
        if not self._history:
            return None
        return self._history[-1]["answer"]

    def reset(self) -> None:
        """Clear all history (called on new document upload)."""
        self._history = []

    def __len__(self) -> int:
        return len(self._history)

    def is_empty(self) -> bool:
        return len(self._history) == 0
