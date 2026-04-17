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
            
            
    async def analyze_news_text(self, text: str) -> dict:
        """Analyze written news text for misinformation, fallacies, and bias"""
        import json
        
        if not self.api_key:
            return {
                "risk_score": 50.0,
                "classification": "SUSPICIOUS",
                "key_claims": ["API Key Missing", "Unable to fully analyze claims"],
                "fallacies_detected": ["Analysis skipped"],
                "verdict": "Provide Claude API Key to enable Textual Analysis",
                "explanation": "The text analysis engine is currently offline."
            }
            
        try:
            prompt = f"""You are PersonaShield AI's Textual Misinformation Engine.
Analyze the following news excerpt or claim for potential misinformation, extreme bias, logical fallacies, and unsubstantiated claims.

TEXT TO ANALYZE:
\"\"\"
{text}
\"\"\"

Perform a rigorous fact-checking analysis. Identify key claims made in the text. Evaluate them for logical consistency and known factual accuracy based on your training.
Respond ONLY with a valid JSON object matching this exact structure:
{{
  "risk_score": <float between 0 and 100, where 100 is pure misinformation/propaganda>,
  "classification": <"REAL", "SUSPICIOUS", or "FAKE">,
  "key_claims": [<list of strings summarizing the 2-3 biggest claims>],
  "fallacies_detected": [<list of strings of logical fallacies or manipulative language used, e.g., 'Strawman', 'Appeal to Emotion'>],
  "verdict": <string, a concise 1-sentence final verdict>,
  "explanation": <string, a detailed 3-4 sentence professional explanation of your risk score>
}}
"""
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
                        "max_tokens": 1000,
                        "messages": [
                            {"role": "user", "content": prompt}
                        ]
                    },
                    timeout=30.0
                )
            
            if response.status_code == 200:
                result = response.json()
                content = result['content'][0]['text']
                
                # Extract JSON from potential markdown blocks
                if "```json" in content:
                    content = content.split("```json")[1].split("```")[0].strip()
                elif "```" in content:
                    content = content.split("```")[1].strip()
                    
                return json.loads(content)
            else:
                error_body = response.text
                logger.error(f"Claude API error during news analysis: {response.status_code} - {error_body}")
                raise Exception(f"Claude API Failed: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error in analyze_news_text: {e}")
            return {
                "risk_score": 0.0,
                "classification": "ERROR",
                "key_claims": [],
                "fallacies_detected": [],
                "verdict": "Error processing text.",
                "explanation": str(e)
            }
    
    
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
        
        prompt = f"""You are PersonaShield AI, an advanced digital forensics and deepfake detection engine.
Analyze the following detection results and generate a highly formal, professional, and objective forensic analysis report.

RISK SCORE: {risk_score}%
CLASSIFICATION: {classification}

DETECTED ARTIFACT SIGNALS:
{signal_text}

Provide your response in the following structured format, using strictly professional, technical, and objective language suitable for a court or security audit:
1. Executive Summary: A one-sentence definitive conclusion regarding the media's authenticity.
2. Forensic Breakdown: Explain how the specific detected signals contribute to the risk score. Use technical terminology (e.g., GAN fingerprints, temporal discontinuity, adversarial noise).
3. Confidence Level: State the confidence in this assessment based on the severity of the signals.

Do not use conversational language. Write as an automated, highly advanced cyber-security AI."""
        
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
