from flask import Flask, render_template, request, jsonify, send_from_directory
from langchain_groq import ChatGroq
from langchain_core.prompts import ChatPromptTemplate
import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()  # Load environment variables from .env file

app = Flask(__name__, static_folder='static', template_folder='templates')

# Initialize Groq client
client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# LLM configuration
llm = ChatGroq(
    model="llama3-8b-8192",
    temperature=0,
    max_tokens=None,
    timeout=None,
    max_retries=2,
)

# Define prompt template
prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful assistant that translates English to {output_language}.",
        ),
        ("user", "{input}"),
    ]
)

@app.route('/update_data', methods=['POST'])
def send_message():
    data = request.json
    selected_scenario = data.get('selectedScenario')
    bubble_class = data.get('bubbleClass')
    selected_language = data.get('selectedLanguage')
    user_input = data.get('constructedPrompt')

    # Log received data for debugging
    print(f"Selected Scenario: {selected_scenario}")
    print(f"Selected Language: {selected_language}")
    print(f"Prompt: {user_input}")

    try:
        # Invoke the LLM with the constructed prompt
        chain = prompt | llm
        response = chain.invoke(
            {
                "input_language": "English",
                "output_language": selected_language,
                "input": user_input,
            }
        )

        # Extract the response text from the AIMessage object
        response_text = response.content

        # Clean the response text
        cleaned_response = clean_and_format_message(response_text)

        # Return the cleaned response
        return jsonify({"result": cleaned_response})
    except Exception as e:
        print(f"API request failed: {e}")
        return jsonify({'error': f'Failed to get response from Groq API: {str(e)}'}), 500

def clean_and_format_message(raw_message):
    # Trim whitespace from the beginning and end of the message
    cleaned_message = raw_message.strip()

    # Replace double newlines with a single newline
    cleaned_message = cleaned_message.replace('\n\n', '\n')

    # Replace asterisks with hyphens for bullet points
    cleaned_message = cleaned_message.replace('* ', '- ')

    # Optionally, escape any HTML in the response to prevent XSS
    cleaned_message = cleaned_message.replace('<', '&lt;').replace('>', '&gt;')

    return cleaned_message

@app.route('/')
def home():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)

