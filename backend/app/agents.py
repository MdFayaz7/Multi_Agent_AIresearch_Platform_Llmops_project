from app.prompts.writer_v1 import writer_prompt
from app.prompts.critic_v1 import critic_prompt
from langgraph.prebuilt import create_react_agent
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate,SystemMessagePromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .tools import web_search,scrape_url
from dotenv import load_dotenv
import os
load_dotenv()
OPENROUTER_API_KEY=os.getenv("OPENROUTER_API_KEY")
llm=ChatOpenAI(
    model="openai/gpt-4o-mini",
    temperature=0,
    api_key=OPENROUTER_API_KEY,
    openai_api_base="https://openrouter.ai/api/v1"   
)

#1st agent
def buid_search_agent():
    return create_react_agent(
        model=llm,
        tools=[web_search]
    )
#2nd agent
def build_reader_agent():
    return create_react_agent(
        model=llm,
        tools=[scrape_url]
    )   
#writer chain

writer_chain=writer_prompt|llm|StrOutputParser()

#critic_chain

critic_chain=critic_prompt|llm|StrOutputParser()
