let bubbleClass = 'api'; // Default bubble class
let selectedLanguage = 'english'; // Default language
let constructedPrompt = "";
let currentTabId = ''; // To track the active tab
let activeScenario = null; // To keep track of the currently active scenario
let selectedScenario = null; // Initialize the variable




// Handle language selection when you first enter the app
document.getElementById('language-select').addEventListener('change', function() {
    const select = this;
    const selectedValue = select.value;

    // Remove 'highlighted' class from all options
    Array.from(select.options).forEach(option => {
        option.classList.remove('highlighted');
    });

    // Add 'highlighted' class to the selected option
    Array.from(select.options).forEach(option => {
        if (option.value === selectedValue) {
            option.classList.add('highlighted');
        }
    });

    selectedLanguage = selectedValue;

    console.log("User has selected language:", selectedLanguage);
});
// Capitalize the first letter of a string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function switchScenario(scenario) {
    console.log(`Scenario received in switchScenario: ${scenario}`); // Log the received scenario

    if (activeScenario != null && activeScenario === scenario) return; // Do nothing if the same scenario is already active

    selectedScenario = scenario;

    // Hide all chat containers
    const containers = document.querySelectorAll('#chat-containers .chat-container');
    containers.forEach(container => container.style.display = 'none');

    // Display the selected chat container
    const selectedContainer = document.getElementById(`chat-${scenario}`);
    if (selectedContainer) {
        selectedContainer.style.display = 'block';
    } else {
        // Create and display a new chat container if it doesn't exist
        createChatContainer(selectedScenario);
    }

    // Update button styles
    updateButtonStyles(selectedScenario);

    // Update active scenario
    activeScenario = selectedScenario;

    // Show the chat controls (input and send button) after a scenario is selected
    document.getElementById('chat-controls').style.display = 'block';
}

function createChatContainer(scenario) {
    const chatContainers = document.getElementById('chat-containers');

    // Ensure the chat containers element exists
    if (!chatContainers) {
        console.error('Chat containers element not found.');
        return;
    }

    // Check if the container already exists
    let existingContainer = document.getElementById(`chat-${scenario}`);
    if (existingContainer) {
        existingContainer.style.display = 'block'; // Show the existing container
        return; // No need to create a new one
    }

    // Create a new chat container
    const newContainer = document.createElement('div');
    newContainer.id = `chat-${scenario}`;
    newContainer.className = 'chat-container';

    // Create and append the chat box
    const chatBox = document.createElement('div');
    chatBox.id = `chat-box-${scenario}`;
    newContainer.appendChild(chatBox);

    // Append the new container to chatContainers
    chatContainers.appendChild(newContainer);

    // Debugging logs to verify the new container
    console.log(`Created new chat container for ${scenario}`);
    console.log(newContainer);

    // Initialize the message variable
    let message = '';

    // Set the message based on the scenario
    switch (scenario) {
        case 'business':
            message = "Meet Dan, your language coach";
            break;
        case 'friends':
            message = "Meet Lisa, your conversation buddy";
            break;
        case 'flirt':
            message = "Meet Alex, your charming tutor";
            break;
        default:
            console.error(`Unknown scenario: ${scenario}`);
            return; // Exit if the scenario is unknown
    }

    // Display the message in the new chat box
    displayMessage(message, "system", scenario);

    // Want to set selected scenario as active only once it's chat box is created

    activeScenario = selectedScenario;
}

function updateButtonStyles(activeScenario) {
    const buttons = document.querySelectorAll('#scenario-buttons button');
    buttons.forEach(button => {
        const scenario = button.id.replace('btn-', '');
        if (scenario === activeScenario) {
            button.classList.add('active');
            button.style.backgroundColor = 'blue'; // Active button color
        } else {
            button.classList.remove('active');
            button.style.backgroundColor = ''; // Default button color
        }
    });
}

function processLLMOutput(llmOutput, scenario) {
     console.log('LLM Output:', llmOutput); // Print the LLM output to the console
     console.log('Scenario passed:', scenario); // Log the passed scenario

    const container = document.createElement('div');
    container.className = 'formatted-output';

    // Define a function to replace text using regex
    function replaceText(text, regex, replacement) {
        return text.replace(regex, replacement);
    }

    // Define regex patterns
    const headingRegex = /\*\*(.*?)\*\*/g; // Matches headings wrapped in **
    const textInParenthesesRegex = /\(([^)]*)\)/g; // Matches translations in parentheses
    const quotesRegex = /"([^"]*)"/g; // Matches all quoted texts
    const listItemRegex = /-\s?([^:]*):\s?([^]*)/g; // Matches list items with translations

    // Apply styling to headings
    let formattedText = replaceText(llmOutput, headingRegex, '<h3>$1</h3>');

    // Apply styling to translations in parentheses
    formattedText = replaceText(formattedText, textInParenthesesRegex, '<span class="translation-text">($1)</span>');

    // Format all quoted texts to be on separate lines and in italics
    formattedText = replaceText(formattedText, quotesRegex, '<p><span class="quoted-text">"$1"</span></p>');

    // Extract and format list items with translations
    formattedText = replaceText(formattedText, listItemRegex, (match, p1, p2) => {
        return `<p>- <span class="original-text">${p1}</span>: ${p2}</p>`;
    });

    // Extract and format specific phrases and examples sections if present
    const phrasesRegex = /Here's a simple phrase you can use:\s*"([^"]*)"/;
    formattedText = replaceText(formattedText, phrasesRegex, '<p><strong>Phrase:</strong> "$1"</p>');

    const exampleRegex = /For example:\s*"([^"]*)"/g;
    formattedText = replaceText(formattedText, exampleRegex, '<p><strong>Example:</strong> "$1"</p>');

    const translationRegex = /Translation:\s*"([^"]*)"/g;
    formattedText = replaceText(formattedText, translationRegex, '<p><strong>Translation:</strong> "$1"</p>');

    const additionalInfoRegex = /You can also add a bit more information about yourself, such as:\s*"([^"]*)"/;
    formattedText = replaceText(formattedText, additionalInfoRegex, '<p><strong>Additional Information:</strong> "$1"</p>');

    const noteRegex = /(?:- "([^"]*)")+/g;
    formattedText = replaceText(formattedText, noteRegex, '<p><strong>Note:</strong> "$1"</p>');

    // Set the formatted text as the inner HTML of the container
    container.innerHTML = formattedText;

    // Return the outerHTML of the container to include it properly in the chat bubble
    return container.outerHTML;
}


function displayMessage(message, origin, scenario) {
    console.log(`Scenario: ${scenario}`);
    const chatBox = document.getElementById(`chat-box-${scenario}`);

    if (!chatBox) {
        console.error(`Chat box for scenario '${scenario}' not found.`);
        return;
    }

    // Create a message container to use flex for alignment
    const messageContainer = document.createElement('div');
    messageContainer.className = 'chat-message'; // Flex container for message alignment

    const chatBubble = document.createElement('div');
    chatBubble.className = 'chat-bubble';

    if (origin === 'user') {
        chatBubble.innerText = message;
        messageContainer.classList.add('user-message'); // Add class for user alignment
    } else if (origin === 'system') {
        chatBubble.className += ` ${scenario}`; // Add scenario class for styling
        message = processLLMOutput(message, scenario); // Process the LLM output
        chatBubble.innerHTML = message; // Set the processed HTML
        messageContainer.classList.add('system-message'); // Add class for system alignment
    }

    // Append the chat bubble to the message container
    messageContainer.appendChild(chatBubble);

    // Append the message container to the chatBox
    chatBox.appendChild(messageContainer);

    // Scroll to the bottom of the chat box
    chatBox.scrollTop = chatBox.scrollHeight;
}

// Function to switch to a specific tab
function switchToTab(tabId) {
    // Hide all chat containers
    const chatContainers = document.querySelectorAll('.chat-container');
    chatContainers.forEach(container => container.classList.add('hidden'));

    // Show the selected chat container
    const selectedChatContainer = document.getElementById(`chat-${tabId}`);
    if (selectedChatContainer) {
        selectedChatContainer.classList.remove('hidden');
        currentTabId = tabId;
    } else {
        console.error(`Chat container with ID chat-${tabId} not found.`);
    }
}

// Example function to determine the appropriate prompt based on the scenario
function generateContextualPrompt(scenario, userMessage) {
    let scenarioPrompt = "";

    switch (scenario) {
        case 'business':
            scenarioPrompt = 'You are an experienced business consultant named Dan. Keep the response short to less than 2 lines. Provide a professional response to the following inquiry. Structure the response as follows: ' +
            '1. A brief greeting. ' +
            '2. A clear, concise answer to the question. If the user has provided a specific piece of text to be translated, please translate the text into ${selectedLanguage}.' +
            '3. Ask clarifying questions if necessary, a suggestion for next steps or additional resources. ' +
            "User's question: {userMessage}";
            break;

        case 'friends':
            scenarioPrompt = 'You are a friendly and casual conversationalist. Keep the response to less than 2 lines. Engage with the user in a warm and inviting manner. Structure your response as follows: ' +
            '1. A friendly greeting.' +
            '2. A very short personal anecdote or opinion related to the question.' +
            "3. If the user has provided a specific piece of text to be translated, please translate the text into ${selectedLanguage}." +
            '4. Ask clarifying questions if necessary or a short open-ended question to encourage further conversation.' +
            "User's question: ${userMessage}";
            break;

        case 'flirt':
            scenarioPrompt = 'You are a charming and respectful flirt. Keep the response short to less than 2 lines. Respond playfully while maintaining appropriateness. Structure the response as follows:' +
            '1. A playful and flirty greeting.' +
            "2. A short compliment or witty comment related to the user's message." +
            "3. A clear answer to the user's question. If the user has provided a specific piece of text to be translated, please translate the text into ${selectedLanguage}." +
            '4. A short light-hearted question or comment to keep the conversation going.' +
            "User's question: ${userMessage}";
            break;

        default:
            scenarioPrompt = 'You are a knowledgeable language assistant. Keep the response short to less than 3-4 lines. Provide helpful and accurate responses. Structure your response as follows:' +
            '1. A brief, friendly greeting.' +
            "2. A clear answer to the user's question. If the user has provided a specific piece of text to be translated, please translate the text into ${selectedLanguage}." +
            '4. An invitation to ask more questions or seek further clarification.' +
            "User's question: ${userMessage}";
            break;
    }
    constructedPrompt = scenarioPrompt;
    return;
}

// Add an event listener for the Enter key
document.getElementById('user-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && selectedScenario != null) {
        event.preventDefault(); // Prevent the default action (e.g., form submission)
        sendDataToServer();
    }
});

// Toggle the notes panel
document.getElementById('toggle-panel-btn').addEventListener('click', function() {
    const panel = document.getElementById('notes-panel');
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
    } else {
        panel.style.display = 'none';
    }
});

// Add note to the list
document.getElementById('add-note-btn').addEventListener('click', function() {
    const noteInput = document.getElementById('note-input');
    const noteText = noteInput.value.trim();

    if (noteText !== '') {
        const noteList = document.getElementById('notes-list');
        const newNote = document.createElement('li');
        newNote.textContent = noteText;
        noteList.appendChild(newNote);
        noteInput.value = ''; // Clear input field
    }
});

// Optionally, add functionality to allow pressing Enter to add a note
document.getElementById('note-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent default form submission
        document.getElementById('add-note-btn').click();
    }
});

// Function to handle sending data to the server
function sendDataToServer() {
    console.log('send data to server scenario:', selectedScenario); // Print the LLM output to the console
    const userInput = document.getElementById(`user-input`).value;
    if (userInput.trim() === "") return; // Prevent sending empty input

    //display the user's message
    displayMessage(userInput, 'user', selectedScenario);

    fetch('/update_data', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            selectedScenario: selectedScenario,
            selectedLanguage: selectedLanguage,
            constructedPrompt: userInput
        })
    })
    .then(response => {
        if (!response.ok) {
            return response.text().then(text => { throw new Error(text); });
        }
        return response.json();
    })
    .then(data => {
        console.log(data);
        // Display the cleaned and formatted response message
        displayMessage(data.result, "system", selectedScenario);
    })
    .catch(error => {
        console.error('Error:', error);
        displayMessage("An error occurred while sending your message.", 'error', selectedScenario);
    });

    // Clear the input field after sending
    document.getElementById(`user-input`).value = '';
}
