from .base_agent import BaseAgent
import pytesseract
from PIL import Image
import requests
from io import BytesIO
from pdf2image import convert_from_bytes
from datetime import datetime

POPLER_PATH = r"C:\Program Files (x86)\poppler-25.07.0\Library\bin"
class DocumentAgent(BaseAgent):
    def __init__(self):
        super().__init__("document_agent")
        self.system_prompt += " Analyze text from uploaded documents or PDFs."

    async def process(self, claim_data: dict) -> dict:
        start_time = datetime.utcnow()
        findings = {"text_extracted": [], "validity": "unknown"}

        for url in claim_data.get("document_urls", []):
            content_type = "unknown"  # <-- FIX: Initialize the variable here
            try:
                response = requests.get(url, timeout=10)
                response.raise_for_status()
                content_type = response.headers.get("Content-Type", "")
                
                if "pdf" in content_type.lower():
                    images = convert_from_bytes(response.content, poppler_path=POPLER_PATH)
                    for img in images:
                        text = pytesseract.image_to_string(img)
                        findings["text_extracted"].append(text)
                    findings["validity"] = "valid" if findings["text_extracted"] else "invalid"
                else:
                    img = Image.open(BytesIO(response.content))
                    text = pytesseract.image_to_string(img)
                    findings["text_extracted"].append(text)
                    findings["validity"] = "valid" if text else "invalid"
            except Exception as e:
                findings["validity"] = "error"
                findings["error"] = str(e)
                findings["file_type"] = content_type

        processing_time = (datetime.utcnow() - start_time).total_seconds()
        return self._create_agent_report(0.9, findings, processing_time)