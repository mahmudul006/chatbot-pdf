from fastapi import FastAPI, UploadFile, File, WebSocket
from langchain_community.embeddings import OllamaEmbeddings
from langchain.text_splitter import CharacterTextSplitter, RecursiveCharacterTextSplitter
from langchain.vectorstores import Qdrant
from langchain.document_loaders import TextLoader
from langchain.chains import RetrievalQA,  ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory
from langchain_community.chat_models import ChatOllama
from langchain.document_loaders import TextLoader
from langchain.document_loaders import PyPDFLoader
from langchain_experimental.text_splitter import SemanticChunker
from qdrant_client import QdrantClient, models
from qdrant_client.http.models import PointStruct, Filter, FieldCondition, MatchValue, MatchAny
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

qdrant_url = os.environ['HRS_QDRANT_HOST']
qdrant_api_key = os.environ['HRS_QDRANT_API_KEY']
class Question(BaseModel):
    question: str
class Answer(BaseModel):
    chat_history: List[Tuple[str, str]]
class ModelName(BaseModel):
    model_name: str
class AudioBlob(BaseModel):
    blob: str
 
app = FastAPI()
client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key) 

 
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http:localhost:8000', 'http:localhost:8083', 'http:localhost:55346', 'http://blocks.seliselocal.com:4100'],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
 
class cbfs(param.Parameterized):
    chat_history = param.List([])
    vector_size = 768
    embedding_model_name = "nomic-embed-text"
    model_name = "llama3-8b-8192"
    collection_name = "Blocks_Wiki_Documents"
    ollama_embeddings = OllamaEmbeddings(model=embedding_model_name, show_progress=True)
    vector_db = Qdrant(client, collection_name, ollama_embeddings)
    
    def create_collection(self, collection_name):
        try:
            print(collection_name)
            collection_exist = False
            try:
                collection_exist = client.collection_exists(collection_name)
            except Exception as e:
                print(f"Exception: {e}")
                collection_exist = False
        
            print(collection_exist)
                
            if not collection_exist:
                client.create_collection(
                    collection_name=collection_name,
                    vectors_config=models.VectorParams(size=self.vector_size, distance=models.Distance.COSINE)
                )
        except Exception as e:
            print(f"An Exception Occured {e}")
            
    def vector_store(self, documents: list[Document], collection_name, payload: dict):
        text_splitter = CharacterTextSplitter.from_tiktoken_encoder(
            chunk_size=1000,
            chunk_overlap=0,
            is_separator_regex=False,
            encoding_name="cl100k_base"
        )
        for doc in documents:
            doc.__dict__.update(payload)
        
        docs = text_splitter.split_documents(documents)  
        
        points = []
        for doc in docs:
            doc_embedding = self.ollama_embeddings.embed_documents([doc.page_content])
            payload['metadata'] = doc.metadata
            payload['page_content'] = doc.page_content
            point_id = str(uuid.uuid4())
            points.append(PointStruct(id=point_id, vector=doc_embedding[0], payload=payload))
        
        client.upsert(
            collection_name=collection_name,
            points=points
        )
    
    def query(self, query):
        # filters = Filter(
        #     must=[
        #         FieldCondition(
        #             key="file_id",
        #             match=MatchValue(value='hrsksjhhshs')
        #         ),
        #         FieldCondition(
        #             key="roles",
        #             match=MatchAny(any=['hrsadminroles', 'hrssssrfff'])
        #         )
        #     ]
        # )
        #retriever = self.vector_db.as_retriever(search_type="similarity", search_kwargs={"k": 15, "filter": filters})

        retriever = self.vector_db.as_retriever(search_type="similarity", search_kwargs={"k": 15})
        qa = cb.get_model(retriever)
        result = qa({"question": query, "chat_history": self.chat_history})
        if self.chat_history is None:
            self.chat_history = []
        # self.chat_history.extend([(query, result["answer"])])
        print(result)
        return result['answer']
        
    def get_model(self, retriever):
        print("model changed")
        qa = ConversationalRetrievalChain.from_llm(
            llm=ChatGroq(temperature=0, model_name=self.model_name,max_tokens=8192),
            chain_type = "stuff",
            retriever= retriever,
            return_source_documents=True,
            return_generated_question=True,
        )
        return qa

    def __init__(self,  **params):
        super(cbfs, self).__init__( **params)
        # self.load_db("stuff", 4)
 
cb = cbfs()
@app.post("/api/chat", response_model=Answer)
async def chat(query: Question):
    print('this is query:', query)
    res = cb.query(query.question)
    print('this is res:', res)
    return JSONResponse(res)
 
@app.post("/api/upload")
async def create_upload_file(files: list[UploadFile]):
    try:
        cb.create_collection(cb.collection_name)
        for file_upload in files:
            with tempfile.NamedTemporaryFile() as temp_file:
                temp_file.write(await file_upload.read())
                file_path = temp_file.name
                pdf_loader = PyPDFLoader(file_path)
                documents: list[Document] = []
                documents.extend(pdf_loader.load())
                
                payload = {}
                payload['name'] = 'hrs-test.pdf'
                payload['file_id'] ='fileId'
                payload['topic_id'] ='topicId'
                
                cb.vector_store(documents, cb.collection_name, payload)
        return {"message": "Files uploaded successfully.", "collection_name": cb.collection_name}
    except Exception as e:
        print(F"An exception occurred {e}")

@app.post("/api/changemodel")
async def change_llm_model(model: ModelName):
    cb.model_name = model.model_name
    cb.get_model()
    return {"message": "Model updated successfully."}

@app.post("/api/speechtotext")
async def speech_to_text(audioblob: AudioBlob):
    import base64
    encode_string = audioblob.blob
    print("-- speech to text --")
    file_path = str(uuid.uuid4()) + '.wav'
    wav_file = open(file_path, "wb")
    decode_string = base64.b64decode(encode_string)
    wav_file.write(decode_string)
    text = faster_whisper(file_path)
    return JSONResponse(text)

def wav_file_close_and_remove(wav_file, file_path):
    try:
        if wav_file is not None and not wav_file.closed:
            wav_file.close()
            os.remove(file_path)
    finally:
        print('--')
        

@app.websocket("/speechtotext")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    import base64
    print("--socket--")
    while True:
        try:
            encode_string = await websocket.receive_text()
            file_path = str(uuid.uuid4()) + '.wav'
            with open(file_path, "wb") as wav_file:
                try:
                    print("-- start speech to text --")
                    decode_string = base64.b64decode(encode_string)
                    wav_file.write(decode_string)
                    
                    print("-- file write completed --")
                    text = faster_whisper(file_path)
                    print(text)
                    await websocket.send_text(text)
                    wav_file_close_and_remove(wav_file, file_path)
                except Exception as e:
                    print(F"An Exception Occurred {e}")
            wav_file_close_and_remove(wav_file, file_path)
        except Exception as e:
            print(F"An Exception Occurred {e}")
            break
        
        print("-- end speech to text --")

def whisper(file_path):
    import whisper
    model = whisper.load_model("medium")
    result = model.transcribe(file_path)
    return result["text"]

def faster_whisper(file_path):
    os.environ["KMP_DUPLICATE_LIB_OK"]="TRUE"
    from faster_whisper import WhisperModel
    model_size = "medium"
    # Run on GPU with FP16
    model = WhisperModel(model_size, device="cuda", compute_type="float16")
    # or run on GPU with INT8
    # model = WhisperModel(model_size, device="cuda", compute_type="int8_float16")
    # or run on CPU with INT8
    # model = WhisperModel(model_size, device="cpu", compute_type="int8")
    segments, info = model.transcribe(file_path, beam_size=5)


    print("Detected language '%s' with probability %f" % (info.language, info.language_probability))
    chunks = ""
    for segment in segments:
        chunks += segment.text
        print("[%.2fs -> %.2fs] %s" % (segment.start, segment.end, segment.text))
    return chunks
    
