# CodeOscan 🧠💻  
**Your AI-powered assistant for code complexity analysis and optimization**

CodeOscan helps developers analyze code efficiency, understand algorithmic complexity, and optimize their solutions — all within a modern, user-friendly web interface. Powered by cutting-edge AI and a clean developer-centric experience.

---

## 🚀 Features

### 🧠 AI-Powered Code Analysis
- **Time & Space Complexity Detection**: Automatically determines time and space complexity of submitted code.
- **Explanation Levels**: Choose the depth of explanation — _Basic_, _Intermediate_, or _Deep_.
- **Optimization Suggestions**: Get actionable AI-driven insights on improving code performance.
- **Language Validation**: Confirms whether the submitted code matches the selected programming language before processing.

### 👤 User Accounts & History Management
- **Authentication**: Secure login/sign-up using email and password via [Supabase Auth](https://supabase.com/docs/guides/auth).
- **Persistent History**: Automatically saves your analyses including:
  - Code snippet  
  - Selected language  
  - Custom title  
  - AI-generated explanation  
  - Personal notes  
- **History Features**:
  - View detailed results  
  - Edit code, title, and language  
  - Delete or favorite entries  
  - Filter by programming language  
  - Manually refresh history  

### 🤝 Collaboration & Personalization
- **User Notes**: Add personal comments to analyses for review or tracking thoughts.
  
### 💡 User Experience
- **Modern UI**: Built with [Next.js](https://nextjs.org/) and styled using [Tailwind CSS](https://tailwindcss.com/) + [ShadCN UI](https://ui.shadcn.dev/).
- **Dark Mode**: Comfortable viewing with theme toggle.
- **Organized Layout**:
  - **Dashboard**: Central place to analyze and view results
  - **Profile Page**: Manage your history
  - **Shared View**: Clean display for shared links

---

## 🛠️ Tech Stack

| Feature             | Technology                      |
|---------------------|----------------------------------|
| Framework           | [Next.js (App Router)](https://nextjs.org/) |
| Language            | TypeScript                      |
| AI Integration      | Genkit + Gemini (Google AI)     |
| Backend / DB        | [Supabase](https://supabase.com/) (PostgreSQL, Auth) |
| UI Components       | [ShadCN UI](https://ui.shadcn.dev/) |
| Styling             | [Tailwind CSS](https://tailwindcss.com/) |

---

## 📦 Installation

```bash
git clone https://github.com/shobithkumarkarnati0302/codeOscan.git
cd codeoscan
npm install
npm run dev
