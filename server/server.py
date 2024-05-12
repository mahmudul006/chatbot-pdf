from fastapi import FastAPI, UploadFile, File, WebSocket
#from langchain_community.embeddings import OllamaEmbeddings
from langchain.text_splitter import CharacterTextSplitter, RecursiveCharacterTextSplitter
from langchain.vectorstores import DocArrayInMemorySearch
from langchain.document_loaders import TextLoader
from langchain.chains import RetrievalQA,  ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_community.chat_models import ChatOllama
from langchain.document_loaders import TextLoader
from langchain.document_loaders import PyPDFLoader
from langchain_experimental.text_splitter import SemanticChunker
from qdrant_client import QdrantClient
from langchain.vectorstores import Qdrant
import qdrant_client
import param
import json
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Tuple, Annotated
from fastapi.responses import JSONResponse
from pathlib import Path
import tempfile
from langchain.docstore.document import Document
import uuid
from langchain_groq import ChatGroq
from dotenv import load_dotenv
import os

load_dotenv()

qdrant_url = os.environ['QDRANT_URL']
qdrant_api_key = os.environ['QDRANT_API_KEY']
class Question(BaseModel):
    question: str
class Answer(BaseModel):
    chat_history: List[Tuple[str, str]]
class ModelName(BaseModel):
    model_name: str
class AudioBlob(BaseModel):
    blob: str
 
app = FastAPI()
client = qdrant_client.QdrantClient(url=qdrant_url, api_key=qdrant_api_key) 

 
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http:localhost:8000', 'http:localhost:8083', 'http:localhost:55346'],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
 
documents = [Document(page_content='dummy', metadata={'source': '/temp', 'page': 0})]
class cbfs(param.Parameterized):
    chat_history = param.List([])
    answer = param.String("")
    db_query  = param.String("")
    db_response = param.List([])
    collection_name = param.String("my_documents_001")
    retriever = None
    qa = None
    model_name = "mixtral-8x7b-32768"

    def changeModel(self):
        self.qa = ConversationalRetrievalChain.from_llm(
            llm=ChatGroq(temperature=0, model_name=self.model_name,max_tokens=8192,),
            chain_type = "stuff",
            retriever= self.retriever,
            return_source_documents=True,
            return_generated_question=True,
        )

    def load_db(self,chain_type="stuff", k=15):
        #embeddings = OllamaEmbeddings(model="nomic-embed-text",show_progress=True)
        
        # text_splitter = SemanticChunker(embeddings)
        text_splitter = CharacterTextSplitter.from_tiktoken_encoder(
            chunk_size=1000,
            chunk_overlap=0,
            # length_function=len,
            is_separator_regex=False,
            encoding_name="cl100k_base",
            # separators=[
            #     "\n\n",
            #     "\n",
            #     " ",
            #     ".",
            #     ",",
            #     "\u200b",  # Zero-width space
            #     "\uff0c",  # Fullwidth comma
            #     "\u3001",  # Ideographic comma
            #     "\uff0e",  # Fullwidth full stop
            #     "\u3002",  # Ideographic full stop
            #     "",
            # ],
        )

        docs = text_splitter.split_documents(documents)

        # self.collection_name = "my_documents_" + str(uuid.uuid4())
        # db = Qdrant.from_documents(
        #     docs,
        #     embeddings,
        #     url=qdrant_url,
        #     prefer_grpc=True,
        #     api_key=qdrant_api_key,
        #     collection_name=self.collection_name,
        # )
        # # define retriever
        # self.retriever = db.as_retriever(search_type="similarity", search_kwargs={"k": k})
        # self.changeModel()
 
    def convchain(self, query):
        result = self.qa({"question": query, "chat_history": self.chat_history})
        if self.chat_history is None:
            self.chat_history = []
        self.chat_history.extend([(query, result["answer"])])
        self.db_query = result["generated_question"]
        self.db_response = result["source_documents"]
        self.answer = result['answer']
        return self.answer

    def __init__(self,  **params):
        super(cbfs, self).__init__( **params)
        self.load_db("stuff", 4)
 
cb = cbfs()
@app.post("/api/chat", response_model=Answer)
async def chat(query: Question):
    # print('this is query:', query)
    # res = cb.convchain(query.question)
    # print('this is res:', res)
    return JSONResponse("hrs")
 
@app.post("/api/upload")
async def create_upload_file(files: list[UploadFile]):
    # client.delete_collection(cb.collection_name)
    for file_upload in files:
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(await file_upload.read())
            file_path = temp_file.name
            pdf_loader = PyPDFLoader(file_path)
            documents.extend(pdf_loader.load())
    cb.load_db()
    return {"message": "Files uploaded successfully.", "collection_name": cb.collection_name}

@app.post("/api/changemodel")
async def changellmModel(model: ModelName):
    cb.model_name = model.model_name
    cb.changeModel()
    return {"message": "Model updated successfully."}

@app.post("/api/speechtotext")
async def speech_to_text(audioblob: AudioBlob):
    import base64
    encode_string = audioblob.blob
    print("-- speech to text --")
    wav_file = open("audio.wav", "wb")
    decode_string = base64.b64decode(encode_string)
    wav_file.write(decode_string)
    text = faster_whisper()
    return JSONResponse(text)

@app.websocket("/speechtotext")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    import base64
    print("--socket--")
    file_path = "audio.wav"
    with open(file_path, "wb") as wav_file:
        while True:
            encode_string = await websocket.receive_text()
            print("-- speech to text --")
            
            decode_string = base64.b64decode(encode_string)
            
            wav_file.write(decode_string)
            text = faster_whisper()
            print(text)
            return await websocket.send_text(text)

def whisper():
    import whisper
    model = whisper.load_model("small")
    result = model.transcribe("audio.wav")
    return result["text"]

def faster_whisper():
    os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"
    from faster_whisper import WhisperModel
    model_size = "small"
    # Run on GPU with FP16
    # model = WhisperModel(model_size, device="cuda", compute_type="float16")
    # or run on GPU with INT8
    model = WhisperModel(model_size, device="cuda", compute_type="int8_float16")
    # or run on CPU with INT8
    # model = WhisperModel(model_size, device="cpu", compute_type="int8")
    segments, info = model.transcribe("audio.wav", beam_size=5)


    print("Detected language '%s' with probability %f" % (info.language, info.language_probability))
    chunks = ""
    for segment in segments:
        chunks += segment.text
        print("[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text))
    return chunks
    
