from fastapi import FastAPI, UploadFile, File
from langchain_community.embeddings import OllamaEmbeddings
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
 
app = FastAPI()
client = qdrant_client.QdrantClient(url=qdrant_url, api_key=qdrant_api_key) 

 
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http:localhost:8000'],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)
 
documents = [Document(page_content='General Introduction    \nAug 2022   Page 28 \n8.3 Printing modules  \nIndividual modules or blocks can be printed out as follows.   \nOpen module => press right mouse button and select "Print".  \n \nNot only what is visible on the screen is printed, but an actual report is generated and printed.  \n \n  \n', metadata={'source': 'C:\\Users\\skb\\AppData\\Local\\Temp\\tmpuhvqpadt', 'page': 0})]

def load_db(chain_type="stuff", k=4):
    # load documents
    # loader = PyPDFLoader("./Once upon a time.pdf")
    # documents = loader.load()
    # print(documents)
    embeddings = OllamaEmbeddings(model="nomic-embed-text",show_progress=True)
    # text_splitter = SemanticChunker(embeddings)
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=100,
        chunk_overlap=20,
        length_function=len,
        is_separator_regex=False,
        separators=[
            "\n\n",
            "\n",
            " ",
            ".",
            ",",
            "\u200b",  # Zero-width space
            "\uff0c",  # Fullwidth comma
            "\u3001",  # Ideographic comma
            "\uff0e",  # Fullwidth full stop
            "\u3002",  # Ideographic full stop
            "",
        ],
    )

    docs = text_splitter.split_documents(documents)

    collection_name = "my_documents_" + str(uuid.uuid4())
    db = Qdrant.from_documents(
        docs,
        embeddings,
        url=qdrant_url,
        prefer_grpc=True,
        api_key=qdrant_api_key,
        collection_name=collection_name,
    )
    # define retriever
    retriever = db.as_retriever(search_type="similarity", search_kwargs={"k": k})
    # create a chatbot chain. Memory is managed externally.
    qa = ConversationalRetrievalChain.from_llm(
        llm=ChatGroq(temperature=0, model_name="mixtral-8x7b-32768"),
        chain_type=chain_type,
        retriever=retriever,
        return_source_documents=True,
        return_generated_question=True,
    )
    return qa, collection_name
class cbfs(param.Parameterized):
    chat_history = param.List([])
    answer = param.String("")
    db_query  = param.String("")
    db_response = param.List([])
    collection_name = param.String("")

    def __init__(self,  **params):
        super(cbfs, self).__init__( **params)
        self.panels = []
        self.loaded_file = "./javascript_tutorial.pdf"
        self.qa, self.collection_name = load_db("stuff", 4)
    def load_db_reinitialize(self):
        self.qa, self.collection_name = load_db("stuff", 4)
 
    def convchain(self, query):
        result = self.qa({"question": query, "chat_history": self.chat_history})
        if self.chat_history is None:
            self.chat_history = []
        self.chat_history.extend([(query, result["answer"])])
        self.db_query = result["generated_question"]
        self.db_response = result["source_documents"]
        self.answer = result['answer']
        return self.answer
 
cb = cbfs()

@app.post("/api/chat", response_model=Answer)
async def chat(query: Question):
    print('this is query:', query)
    res = cb.convchain(query.question)
    print('this is res:', res)
    return JSONResponse(res)
 
@app.post("/api/upload")
async def create_upload_file(files: list[UploadFile]):
    client.delete_collection(cb.collection_name)

    for file_upload in files:
        with tempfile.NamedTemporaryFile(delete=False) as temp_file:
            temp_file.write(await file_upload.read())
            file_path = temp_file.name
            pdf_loader = PyPDFLoader(file_path)
            documents.extend(pdf_loader.load())
    cb.load_db_reinitialize()
    return {"message": "Files uploaded successfully.", "collection_name": cb.collection_name}