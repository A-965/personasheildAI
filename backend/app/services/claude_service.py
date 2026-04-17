"""Claude API Integration Service"""
import httpx
import logging
from typing import Optional
import asyncio

logger = logging.getLogger(__name__)


class ClaudeService:
    """Service for generating AI explanations via Claude API"""
    
    def __init__(self, api_key: str, model: str = "claude-3-sonnet-20240229"):
        self.api_key = api_key
        self.model = model
        self.base_url = "https://api.anthropic.com/v1"
        self.client = None
    
    
    async def generate_explanation(
        self, 
        risk_score: float,
        classification: str,
        signals: list,
        metadata: Optional[dict] = None
    ) -> str:
        """Generate plain English explanation for detection results"""
        
        if not self.api_key:
            return self._generate_default_explanation(risk_score, classification, signals)
        
        try:
            prompt = self._build_prompt(risk_score, classification, signals, metadata)
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.base_url}/messages",
                    headers={
                        "x-api-key": self.api_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": self.model,
                        "max_tokens": 500,
                        "messages": [
                            {"role": "user", "content": prompt}
                        ]
                    },
                    timeout=30.0
                )
            
            if response.status_code == 200:
                result = response.json()
                explanation = result['content'][0]['text']
                return explanation
            else:
                logger.error(f"Claude API error: {response.status_code}")
                return self._generate_default_explanation(risk_score, classification, signals)
                
        except asyncio.TimeoutError:
            logger.warning("Claude API request timed out")
            return self._generate_default_explanation(risk_score, classification, signals)
        except Exception as e:
            logger.error(f"Error calling Claude API: {e}")
            return self._generate_default_explanation(risk_score, classification, signals)
    
    
    def _build_prompt(
        self,
        risk_score: float,
        classification: str,
        signals: list,
        metadata: Optional[dict] = None
    ) -> str:
        """Build prompt for Claude"""
        
        signal_text = "\n".join([
            f"- {s.type}: {s.description} (severity: {s.severity})"
            for s in signals
        ])
        
        prompt = f"""Analyze this deepfake detection result and provide a brief, clear explanation:

Risk Score: {risk_score}%
Classification: {classification}

Detected Signals:
{signal_text}

Please provide:
1. A brief summary of whether this is likely real or fake
2. The main indicators of manipulation
3. What specific artifacts suggest this classification
4. Confidence level in the assessment

Keep it concise and understandable for a general audience."""
        
        return prompt
    
    
    def _generate_default_explanation(
        self,
        risk_score: float,
        classification: str,
        signals: list
    ) -> str:
        """Generate default explanation when Claude API is unavailable"""
        
        signal_descriptions = ", ".join([s.type for s in signals]) if signals else "none"
        
        if classification == "LIKELY FAKE":
            return f"""This media shows multiple indicators of manipulation or deepfake.
            
Risk Score: {risk_score}%

Detected Anomalies: {signal_descriptions}

This content appears to have been artificially generated or significantly edited using AI techniques. 
The detected artifacts suggest face swapping, expression modification, or other synthetic content generation.
We recommend treating this media with skepticism and verifying from trusted sources."""
            
        elif classification == "SUSPICIOUS":
            return f"""This media has mixed indicators that warrant further investigation.

Risk Score: {risk_score}%

Detected Anomalies: {signal_descriptions}

Some artifacts suggest possible manipulation, but they could also be from legitimate editing, 
compression, or camera artifacts. The evidence is inconclusive. We recommend additional verification 
from multiple sources before drawing conclusions."""
            
        else:  # LIKELY REAL
            return f"""This media appears to be genuine or minimally edited.

Risk Score: {risk_score}%

Detected Anomalies: {signal_descriptions or "minimal"}

No significant indicators of deepfake manipulation were detected. However, advanced techniques 
may still evade detection. Always verify content from trusted sources and check for reliable 
independent verification."""
