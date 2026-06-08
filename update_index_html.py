import re
import os

def main():
    workspace_dir = r"C:\Users\guerr\.gemini\antigravity\scratch\recoverflow"
    index_path = os.path.join(workspace_dir, "index.html")
    dashboard_path = os.path.join(workspace_dir, "src", "components", "Dashboard.jsx")

    # Read Dashboard.jsx
    with open(dashboard_path, "r", encoding="utf-8") as f:
        dashboard_content = f.read()

    # Extract the Dashboard component body
    # It starts with "function Dashboard() {" and ends with "export default Dashboard"
    dashboard_match = re.search(r"function Dashboard\(\)\s*\{(.*)\}?\s*\n*export default Dashboard", dashboard_content, re.DOTALL)
    if not dashboard_match:
        print("Could not find Dashboard function in Dashboard.jsx")
        return

    dashboard_body = dashboard_match.group(1)

    # We need to prepend the icon mapping inside the component
    icon_mappings = """
        const TrendingUp = (props) => Icons.TrendingUp(props);
        const Mail = (props) => Icons.Mail(props);
        const DollarSign = (props) => Icons.Dollar(props);
        const Percent = (props) => Icons.Percent(props);
        const Play = (props) => Icons.Play(props);
        const Terminal = (props) => Icons.Terminal(props);
        const CheckCircle2 = (props) => Icons.CheckCircle(props);
        const AlertCircle = (props) => Icons.AlertCircle(props);
        const Clock = (props) => Icons.Clock(props);
        const XCircle = (props) => Icons.XCircle(props);
        const Send = (props) => Icons.Send(props);
        const Plus = (props) => Icons.Plus(props);
        const Eye = (props) => Icons.Eye(props);
        const Settings = (props) => Icons.Settings(props);
        const Code = (props) => Icons.Code(props);
    """
    
    dashboard_react = "function Dashboard() {" + icon_mappings + dashboard_body

    # Read index.html
    with open(index_path, "r", encoding="utf-8") as f:
        index_content = f.read()

    # 1. Update Icons definition in index.html to support props and add Plus and Settings
    new_icons_block = """      const Icons = {
        TrendingUp: (props) => (
          <svg className={props.className || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        ),
        TrendingUpSmall: (props) => (
          <svg className={props.className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        ),
        Mail: (props) => (
          <svg className={props.className || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        ),
        ShieldCheck: (props) => (
          <svg className={props.className || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        ),
        Dollar: (props) => (
          <svg className={props.className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M12 16v1" />
          </svg>
        ),
        Percent: (props) => (
          <svg className={props.className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L15 9m4 0a1 1 0 11-2 0 1 1 0 012 0zm-10 6a1 1 0 11-2 0 1 1 0 012 0z" />
          </svg>
        ),
        Zap: (props) => (
          <svg className={props.className || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        ),
        Sparkles: (props) => (
          <svg className={props.className || "w-3.5 h-3.5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        ),
        ArrowRight: (props) => (
          <svg className={props.className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        ),
        ArrowRightSmall: (props) => (
          <svg className={props.className || "w-3 h-3"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        ),
        CheckCircle: (props) => (
          <svg className={props.className || "w-6 h-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        CheckCircleSmall: (props) => (
          <svg className={props.className || "w-4 h-4 text-emerald-400"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        AlertCircle: (props) => (
          <svg className={props.className || "w-3.5 h-3.5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        ),
        Clock: (props) => (
          <svg className={props.className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        XCircle: (props) => (
          <svg className={props.className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
        Terminal: (props) => (
          <svg className={props.className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        ),
        Play: (props) => (
          <svg className={props.className || "w-5 h-5 fill-current"} viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        ),
        Eye: (props) => (
          <svg className={props.className || "w-3.5 h-3.5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
        ),
        Send: (props) => (
          <svg className={props.className || "w-3.5 h-3.5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        ),
        Code: (props) => (
          <svg className={props.className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        ),
        Plus: (props) => (
          <svg className={props.className || "w-4 h-4"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        ),
        Settings: (props) => (
          <svg className={props.className || "w-5 h-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )
      };"""

    # Replace the Icons block in index.html
    # Find match from "const Icons = {" to "};"
    index_content = re.sub(
        r"const Icons = \{.*?\};", 
        new_icons_block, 
        index_content, 
        flags=re.DOTALL
    )

    # 2. Replace the Dashboard component definition in index.html
    # It matches "function Dashboard() { ... }" (until the LandingPage or App component starts or script tags)
    # Since there are multiple "function Dashboard() {" we match the definition.
    # In index.html:
    # "// --- DASHBOARD COMPONENT (INCLUDING INTEGRATED STRIPE WEBHOOK SIMULATOR & CUSTOMIZER) ---"
    # "function Dashboard() { ... }"
    index_content = re.sub(
        r"// --- DASHBOARD COMPONENT.*?\n\s*function Dashboard\(\)\s*\{.*?\}\n\s*// --- MAIN APPLICATION COMPONENT ---",
        f"// --- DASHBOARD COMPONENT (INCLUDING INTEGRATED STRIPE WEBHOOK SIMULATOR & CUSTOMIZER) ---\n      {dashboard_react}\n\n      // --- MAIN APPLICATION COMPONENT ---",
        index_content,
        flags=re.DOTALL
    )

    with open(index_path, "w", encoding="utf-8") as f:
        f.write(index_content)

    print("index.html updated successfully!")

if __name__ == "__main__":
    main()
