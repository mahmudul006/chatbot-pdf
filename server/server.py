from fastapi import FastAPI
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
import param
import json
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Tuple

class Question(BaseModel):
    question: str
class Answer(BaseModel):
    chat_history: List[Tuple[str, str]]

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['http://localhost:3000', 'http:localhost:8000'],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


def load_db(chain_type="stuff", k=4):
    # load documents
    loader = PyPDFLoader("./Once upon a time.pdf")
    documents = loader.load()
    embeddings = OllamaEmbeddings(model="nomic-embed-text",show_progress=True)
    text_splitter = SemanticChunker(embeddings)
    docs = text_splitter.split_documents(documents)
    url = "https://82f0b180-dd10-41f1-80a2-1446cc29596b.us-east4-0.gcp.cloud.qdrant.io:6333"
    api_key="Enb2r7ZXSERf_9p6RUb6LjWvLTnsoqm34kYE2BHPE5GBNQ4XO1V_PA"
    db = Qdrant.from_documents(
        docs, 
        embeddings, 
        url=url, 
        prefer_grpc=True,
        api_key=api_key,
        collection_name="my_documents",
    )
    # define retriever
    retriever = db.as_retriever(search_type="similarity", search_kwargs={"k": k})
    # create a chatbot chain. Memory is managed externally.
    qa = ConversationalRetrievalChain.from_llm(
        llm=ChatOllama(model="llama3", temperature=0), 
        chain_type=chain_type, 
        retriever=retriever, 
        return_source_documents=True,
        return_generated_question=True,
    )
    return qa 
class cbfs(param.Parameterized):
    chat_history = param.List([])
    answer = param.String("")
    db_query  = param.String("")
    db_response = param.List([])
    
    def __init__(self,  **params):
        super(cbfs, self).__init__( **params)
        self.panels = []
        self.loaded_file = "./javascript_tutorial.pdf"
        self.qa = load_db("stuff", 4)
    
    # def call_load_db(self, count):
    #     if count == 0 or file_input.value is None:  # init or no file specified :
    #         return pn.pane.Markdown(f"Loaded File: {self.loaded_file}")
    #     else:
    #         file_input.save("temp.pdf")  # local copy
    #         self.loaded_file = file_input.filename
    #         button_load.button_style="outline"
    #         self.qa = load_db("temp.pdf", "stuff", 4)
    #         button_load.button_style="solid"
    #     self.clr_history()
    #     return pn.pane.Markdown(f"Loaded File: {self.loaded_file}")

    def convchain(self, query):
        # if not query:
        #     return pn.WidgetBox(pn.Row('User:', pn.pane.Markdown("", width=600)), scroll=True)
        result = self.qa({"question": query, "chat_history": self.chat_history})
        if self.chat_history is None:
            self.chat_history = []
        self.chat_history.extend([(query, result["answer"])])
        self.db_query = result["generated_question"]
        self.db_response = result["source_documents"]
        self.answer = result['answer']
        return self.chat_history

        # self.panels.extend([
        #     pn.Row('User:', pn.pane.Markdown(query, width=600)),
        #     pn.Row('ChatBot:', pn.pane.Markdown(self.answer, width=600, style={'background-color': '#F6F6F6'}))
        # ])
        # inp.value = ''  #clears loading indicator when cleared
        # return pn.WidgetBox(*self.panels,scroll=True)

    # @param.depends('db_query ', )
    # def get_lquest(self):
    #     if not self.db_query :
    #         return pn.Column(
    #             pn.Row(pn.pane.Markdown(f"Last question to DB:", styles={'background-color': '#F6F6F6'})),
    #             pn.Row(pn.pane.Str("no DB accesses so far"))
    #         )
    #     return pn.Column(
    #         pn.Row(pn.pane.Markdown(f"DB query:", styles={'background-color': '#F6F6F6'})),
    #         pn.pane.Str(self.db_query )
    #     )

    # @param.depends('db_response', )
    # def get_sources(self):
    #     if not self.db_response:
    #         return 
    #     rlist=[pn.Row(pn.pane.Markdown(f"Result of DB lookup:", styles={'background-color': '#F6F6F6'}))]
    #     for doc in self.db_response:
    #         rlist.append(pn.Row(pn.pane.Str(doc)))
    #     return pn.WidgetBox(*rlist, width=600, scroll=True)

    # @param.depends('convchain', 'clr_history') 
    # def get_chats(self):
    #     if not self.chat_history:
    #         return pn.WidgetBox(pn.Row(pn.pane.Str("No History Yet")), width=600, scroll=True)
    #     rlist=[pn.Row(pn.pane.Markdown(f"Current Chat History variable", styles={'background-color': '#F6F6F6'}))]
    #     for exchange in self.chat_history:
    #         rlist.append(pn.Row(pn.pane.Str(exchange)))
    #     return pn.WidgetBox(*rlist, width=600, scroll=True)

    # def clr_history(self,count=0):
    #     self.chat_history = []
    #     return
cb = cbfs()
@app.post("/api/chat", response_model=Answer)
async def chat(query: Question):
    print('this is query:', query)
    res = cb.convchain(query.question)
    print('this is res:', res)
    return res
 
def hello_world():
    return "<p>Hello, World!</p>"