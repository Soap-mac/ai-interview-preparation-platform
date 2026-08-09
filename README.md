# 🎯 AI-Powered Interview Preparation Platform

> **An AI-driven interview simulator that doesn't just ask questions — it evaluates how you answer, identifies where you struggle, and turns your interview history into actionable insights.**

**Status:** 🚧 Under Active Development

---

## 📌 Overview

Most interview preparation platforms focus primarily on providing questions.

The problem is that knowing what question to practice is only one part of interview preparation. Candidates also need to understand:

* Was my answer technically correct?
* Did I explain the concept clearly?
* Was my explanation deep enough?
* Which concepts am I repeatedly getting wrong?
* Which topics are my strengths?
* What should I improve next?

This project was built to address that gap.

The **AI-Powered Interview Preparation Platform** is a full-stack web application that simulates technical interviews, dynamically generates questions using AI, evaluates candidate responses, executes DSA solutions, and converts interview history into personalized performance insights.

---

## ✨ Core Features

### 🤖 AI-Powered Interview Generation

Interview questions are dynamically generated based on the selected interview category.

Currently supported areas include:

* Data Structures & Algorithms
* Operating Systems
* Database Management Systems
* Computer Networks
* HR Interviews

Instead of relying entirely on a fixed question bank, the platform uses AI to dynamically generate interview questions.

---

### 🧠 Intelligent Answer Evaluation

For conceptual interviews, users submit text-based answers which are evaluated by an AI evaluation service.

The evaluation analyzes multiple dimensions:

| Evaluation Parameter | Purpose                                                 |
| -------------------- | ------------------------------------------------------- |
| **Correctness**      | Determines whether the technical answer is accurate     |
| **Clarity**          | Evaluates how clearly the concept is explained          |
| **Depth**            | Measures the level of conceptual understanding          |
| **Strengths**        | Identifies what the candidate explained well            |
| **Weaknesses**       | Identifies areas that need improvement                  |
| **Conceptual Gaps**  | Detects concepts the candidate appears to misunderstand |

The AI response is converted into a structured format, validated by the backend, and stored with the interview session for future analysis.

---

### 💻 DSA Coding Interviews

The platform provides an interactive coding environment for DSA interviews using **Monaco Editor**.

Users can:

* Write code directly in the browser.
* Select supported programming languages.
* Run code against sample test cases.
* Debug their implementation.
* Submit solutions against hidden test cases.

For code execution, the platform integrates the **Glot API**.

User-submitted code is sent to Glot for execution, and the resulting output, errors, and execution status are processed by the backend.

After submission, the solution and execution results are analyzed by AI to provide feedback about:

* Correctness
* Problem-solving approach
* Possible improvements
* Code quality

### DSA Execution Flow

```text
User writes code
       │
       ▼
Monaco Editor
       │
       ▼
Backend API
       │
       ▼
Glot API
       │
       ├── Sample test cases
       │
       └── Hidden test cases
       │
       ▼
Execution results
       │
       ▼
Backend processes results
       │
       ▼
AI analyzes solution
       │
       ▼
DSA feedback
```

---

### 📊 Personalized Performance Analytics

Interview results are stored and used to build a performance history.

Users can analyze:

* Interview history
* Topic-wise performance
* Strongest topics
* Weakest topics
* Recurring conceptual gaps

This transforms individual interview attempts into a longer-term view of the candidate's preparation.

---

### 🔎 Conceptual Gap Normalization

One challenge with AI-generated feedback is that the same underlying concept can be expressed using different wording.

For example:

```text
"Database indexing"
"Understanding indexes"
"Indexing in DBMS"
"How database indexes work"
```

These may represent the same underlying conceptual gap.

The platform therefore includes a **normalization layer** that groups semantically similar gaps before generating analytics.

This prevents the dashboard from treating the same weakness as multiple unrelated problems.

---

# 🏗️ System Architecture

```text
                         ┌─────────────────────────┐
                         │       React Frontend     │
                         │                         │
                         │  Interview UI           │
                         │  Dashboard              │
                         │  Monaco Editor           │
                         │  Authentication UI       │
                         └────────────┬────────────┘
                                      │
                              REST API + JWT
                                      │
                         ┌────────────▼────────────┐
                         │    Node.js + Express     │
                         │                         │
                         │  Authentication         │
                         │  Interview Management   │
                         │  Question Generation    │
                         │  Answer Evaluation      │
                         │  DSA Evaluation         │
                         │  Analytics              │
                         └───────┬────────┬────────┘
                                 │        │
                  ┌──────────────┘        └──────────────┐
                  │                                      │
         ┌────────▼────────┐                    ┌────────▼────────┐
         │     MongoDB     │                    │   AI Services   │
         │                 │                    │                 │
         │ Users           │                    │ Question Gen.   │
         │ Interviews      │                    │ Answer Eval.    │
         │ Performance     │                    │ Code Analysis   │
         └─────────────────┘                    └─────────────────┘
                                                        │
                                               ┌────────▼────────┐
                                               │    Glot API     │
                                               │ Code Execution  │
                                               └─────────────────┘
```

---

# 🔄 Interview Workflow

## Conceptual Interview

```text
Select Topic
     │
     ▼
Generate Question using AI
     │
     ▼
User submits answer
     │
     ▼
AI Evaluation Service
     │
     ▼
Structured Evaluation
     │
     ├── Correctness
     ├── Clarity
     ├── Depth
     ├── Strengths
     ├── Weaknesses
     └── Conceptual Gaps
     │
     ▼
Validate + Store Result
     │
     ▼
Update Performance Analytics
```

---

## DSA Interview

```text
Select DSA Interview
        │
        ▼
Generate Problem
        │
        ▼
Write Solution in Monaco Editor
        │
        ├───────────────┐
        ▼               ▼
Sample Tests       Final Submission
        │               │
        ▼               ▼
    Debugging       Hidden Tests
                        │
                        ▼
                    Glot API
                        │
                        ▼
                Execution Results
                        │
                        ▼
                  AI Analysis
                        │
                        ▼
              Feedback + Performance
```

---

# 🤖 AI Architecture

AI is used at multiple stages of the interview workflow rather than as a single chatbot.

```text
                 ┌──────────────────┐
                 │ Interview Setup  │
                 └────────┬─────────┘
                          │
                          ▼
                ┌───────────────────┐
                │ Question Generator│
                └─────────┬─────────┘
                          │
                          ▼
                    User Response
                          │
             ┌────────────┴────────────┐
             │                         │
       Conceptual                  DSA Code
          Answer                       │
             │                         ▼
             │                    Glot API
             │                         │
             │                  Execution Results
             │                         │
             └────────────┬────────────┘
                          │
                          ▼
                  AI Evaluation
                          │
                          ▼
                Structured Feedback
                          │
                          ▼
                   MongoDB Storage
                          │
                          ▼
                    Analytics
```

The application separates **question generation, code execution, AI evaluation, persistence, and analytics** into different responsibilities.

---

# 🔐 Authentication & Security

The application uses JWT-based authentication to protect user-specific resources.

Security considerations include:

* JWT-based authentication.
* Authentication middleware for protected routes.
* Server-side authorization checks.
* Sensitive credentials stored through environment variables.
* `.env` files excluded from version control.
* User-submitted code sent to the Glot execution service rather than being directly executed inside the main Node.js application process.

> **Important:** This project is still under development, and security hardening is an ongoing process.

---

# 🧩 Technology Stack

## Frontend

![React](https://img.shields.io/badge/React-20232A?style=for-the-badge\&logo=react\&logoColor=61DAFB)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-0F172A?style=for-the-badge\&logo=tailwindcss\&logoColor=38BDF8)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge\&logo=vite\&logoColor=white)

* React
* Tailwind CSS
* Vite
* Monaco Editor

## Backend

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge\&logo=node.js\&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge\&logo=express\&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge\&logo=mongodb\&logoColor=white)

* Node.js
* Express.js
* MongoDB
* Mongoose
* REST APIs
* JWT Authentication

## AI & External Services

* LLM API for interview question generation
* LLM API for answer evaluation
* AI-assisted DSA solution analysis
* **Glot API** for code execution

---

# 📁 Project Structure

```text
project/
│
├── backend/
│   │
│   ├── compilers/
│   │   ├── cpp.js
│   │   ├── java.js
│   │   ├── js.js
│   │   └── python.js
│   │
│   ├── databases/
│   │   └── connection.js
│   │
│   ├── LanguageFunctionExtraction/
│   │   ├── Js.js
│   │   ├── cpp.js
│   │   ├── java.js
│   │   └── python.js
│   │
│   ├── middlewares/
│   │   └── authMiddleware.js
│   │
│   ├── models/
│   │   ├── user.js
│   │   └── interview.js
│   │
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── interviewRoutes.js
│   │   └── dsaInterview.js
│   │
│   ├── services/
│   │   ├── generateQuestion.js
│   │   ├── generateDSA.js
│   │   ├── evaluateAnswer.js
│   │   ├── evaluateDSA.js
│   │   ├── checkTestCases.js
│   │   ├── getNextDifficulty.js
│   │   └── conceptualGapNormalization.js
│   │
│   ├── utils/
│   │   ├── aiClient.js
│   │   └── buildFinalCode.js
│   │
│   ├── index.js
│   └── package.json
│
├── frontend/
│   │
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── InterviewReport.jsx
│   │   │   ├── InterviewSession.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── StartInterview.jsx
│   │   │   ├── codeEditor.jsx
│   │   │   └── signup.jsx
│   │   │
│   │   ├── api.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   └── package.json
│
├── .gitignore
└── README.md
```

---

# 🧠 Key Engineering Challenges

## 1. Handling Unpredictable AI Responses

LLMs do not guarantee perfectly structured output.

The backend therefore validates and processes AI-generated responses before storing them in MongoDB.

This prevents malformed AI responses from directly corrupting application data.

---

## 2. Supporting Multiple Interview Types

A conceptual DBMS interview and a DSA coding interview produce fundamentally different data.

The backend architecture therefore needs to support:

```text
Conceptual Interviews
        +
DSA Coding Interviews
        +
HR Interviews
        +
Future Interview Types
```

while keeping the application extensible.

---

## 3. Code Execution

Executing arbitrary user-submitted code directly inside the backend would create significant security and reliability concerns.

Instead, submitted code is sent to the **Glot API**, which handles code execution and returns the execution results to the application.

The backend then processes these results and uses them as part of the DSA evaluation workflow.

---

## 4. Meaningful Analytics from AI Feedback

Raw AI-generated conceptual gaps are not suitable for direct aggregation because the same concept can appear under different names.

The normalization layer groups semantically similar gaps before calculating recurring weaknesses.

This produces more meaningful topic-level analytics.

---

## 5. AI + Application Data Integration

AI is not treated as the database or source of truth.

The application follows a structured workflow:

```text
User Input
    ↓
AI Processing
    ↓
Structured Response
    ↓
Validation
    ↓
Database Storage
    ↓
Analytics
```

This allows AI-generated information to become part of a deterministic application workflow rather than relying directly on raw model output.

---

# 🚀 Getting Started

## Prerequisites

Make sure you have installed:

* Node.js
* npm
* MongoDB
* Git

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd project
```

---

## 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file inside the `backend` directory:

```env
MONGO_URI=
JWT_SECRET=
AI_API_KEY=
GLOT_API_KEY=
```

Start the backend:

```bash
npm run dev
```

---

## 3. Frontend Setup

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will then be available through the Vite development server.

---

# 🗺️ Roadmap

The project is currently under active development.

### Completed / In Progress

* [x] User authentication
* [x] AI-generated interview questions
* [x] Conceptual interview evaluation
* [x] DSA coding environment
* [x] Monaco Editor integration
* [x] Sample test case execution
* [x] Hidden test case execution
* [x] Glot API integration
* [x] AI-based DSA analysis
* [x] Interview history
* [x] Topic-wise analytics
* [x] Conceptual gap normalization

### Planned

* [ ] Improve adaptive interview difficulty
* [ ] Expand performance analytics
* [ ] Improve AI evaluation reliability
* [ ] Add more interview categories
* [ ] Improve UI/UX
* [ ] Production deployment
* [ ] Improve error handling
* [ ] Add application monitoring
* [ ] Improve authentication and security hardening

---

# 📸 Screenshots

Screenshots will be added as the project reaches a more stable release.

---

# 🎥 Demo

**Coming soon.**

---

# 👨‍💻 Author

## Arpit Mishra

**B.Tech — Computer Science & Information Technology**

Interested in building full-stack applications, AI-powered developer tools, and practical software systems.

---

## ⭐ Project Status

This project is being actively developed as a personal **Full-Stack + AI Engineering project**.

The architecture and features may continue to evolve as new functionality is added and existing components are improved.

If you find the project interesting, feel free to explore the repository and follow its development.
