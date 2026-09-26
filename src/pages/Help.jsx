import { useEffect } from "react";

function markHelpVisited() {
  try {
    localStorage.setItem("hasSeenHelpBanner", "true");
  } catch {
    // localStorage may be unavailable (private browsing, etc.); safe to ignore
  }
}

function Section({ title, children }) {
  return (
    <section className="bg-white rounded-xl border border-sand-200 shadow-sm p-5 sm:p-6">
      <h2 className="text-base sm:text-lg font-semibold text-clay-900">{title}</h2>
      <div className="mt-3 space-y-3 text-sm sm:text-base leading-relaxed text-clay-700">
        {children}
      </div>
    </section>
  );
}

function Steps({ items }) {
  return (
    <ol className="space-y-2.5 list-decimal list-outside pl-5">
      {items.map((item, i) => (
        <li key={i} className="pl-1">{item}</li>
      ))}
    </ol>
  );
}

export default function Help() {
  useEffect(() => {
    markHelpVisited();
  }, []);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-semibold text-clay-900">Help &amp; How to Use</h1>
        <p className="text-sm text-clay-500 mt-1">
          A simple guide to every part of this app. Take your time, and feel free to come back
          here whenever you need to.
        </p>
      </div>

      <Section title="What this app is for">
        <p>
          This app is a shared place for our family to keep track of every expense on
          the house that is being built, so nothing has to be written down on paper,
          and everyone in the family can see, at any time, where the money is going.
          Anyone in the family can log in and add an expense, check the budget, or
          look at the building plans, all from one place.
        </p>
      </Section>

      <Section title="Dashboard: the home screen">
        <p>When you log in, you land on the Dashboard. It gives you a quick picture of the whole house budget:</p>
        <Steps
          items={[
            <><strong>Total Budget</strong>: the total amount of money set aside for the whole house.</>,
            <><strong>Total Spent</strong>: how much has been spent so far, added up from every expense entered.</>,
            <><strong>Remaining</strong>: how much money is left (Total Budget minus Total Spent).</>,
            <>The <strong>"Spend by Category"</strong> circle chart shows which parts of the house (like Foundation or Electrical) have used up the most money. Bigger slices mean more money spent there.</>,
            <>The <strong>"Monthly Spend Trend"</strong> bar chart shows how much was spent in each month, so you can see if spending is going up or down over time.</>,
          ]}
        />
      </Section>

      <Section title="Adding an expense">
        <p>Every time money is spent on the house, it should be entered here so the totals stay correct.</p>
        <Steps
          items={[
            <>Click <strong>"Expenses"</strong> in the menu, or use the <strong>"Add Expense"</strong> button on the Dashboard. Both take you to the same form.</>,
            "Enter the date the money was spent.",
            "Enter the amount that was spent.",
            "Choose the category it belongs to (for example, Foundation, Roofing, or Electrical).",
            "Enter who paid for it.",
            "Choose how it was paid (for example, cash, bank transfer, or card).",
            "If you'd like, add a short note to remember what it was for (this step is optional).",
            <>Click <strong>"Save"</strong> and it will appear in the list right away.</>,
          ]}
        />
      </Section>

      <Section title="Editing or deleting an expense">
        <p>Made a mistake, or need to change something you entered earlier? That's easy to fix.</p>
        <Steps
          items={[
            <>Go to the <strong>"Expenses"</strong> page. Every expense you've entered is listed there.</>,
            <>Next to each expense, you'll see an <strong>"Edit"</strong> button and a <strong>"Delete"</strong> button.</>,
            <>Tap <strong>"Edit"</strong> to change any detail, then save it again.</>,
            <>Tap <strong>"Delete"</strong> to remove it. The app will always ask <em>"Are you sure?"</em> first, so you won't ever delete something by accident. Just confirm if you really want to remove it, or cancel if you changed your mind.</>,
          ]}
        />
      </Section>

      <Section title="Budget page: planning where the money goes">
        <p>
          "Categories" are just the different parts of building the house, for example
          Foundation, Roofing, Electrical, or Plumbing. Splitting the budget into
          categories makes it easy to see which parts of the house are costing more or
          less than expected.
        </p>
        <Steps
          items={[
            <>Go to the <strong>"Budget"</strong> page from the menu.</>,
            <>To add a new category, click <strong>"Add Category"</strong>, give it a name (like "Roofing"), and enter the amount of money you plan to spend on it (this is called the allocated amount).</>,
            <>Each category shows a colored progress bar that fills up as more money is spent in that category. <span className="text-leaf-700 font-medium">Green</span> means you're comfortably within budget, while a bar that turns <span className="text-red-600 font-medium">red</span> means that category has gone over its planned amount.</>,
            <>At the top of the page you can set the <strong>Total House Budget</strong>, the overall amount planned for the entire house. Click <strong>"Edit"</strong> next to it, type in the new amount, and click <strong>"Save"</strong>.</>,
          ]}
        />
      </Section>

      <Section title="Plans page: storing building documents">
        <p>
          This is where you can keep photos or PDF files of the house plans, so they're
          never lost and everyone in the family can look at them anytime.
        </p>
        <Steps
          items={[
            <>Go to the <strong>"Plans"</strong> page from the menu.</>,
            <>Under <strong>"Upload a plan"</strong>, choose a photo or PDF file from your phone or computer.</>,
            <>Give it a short title (for example, "Ground Floor Layout") and pick a category: <strong>Building Plan</strong>, <strong>Structural Plan</strong>, <strong>Interior Design</strong>, <strong>Layout Plan</strong>, or <strong>Other</strong>, whichever best describes the document.</>,
            "You can add a short note too, if you'd like, then click \"Upload Plan\".",
            <>To look at a plan later, find it in the list and click <strong>"View"</strong>. To remove one that's no longer needed, click <strong>"Delete"</strong> and confirm.</>,
          ]}
        />
      </Section>

      <Section title="Changing your password">
        <p>If you ever want to change your password, for example to something easier to remember, or for safety, you can do it yourself, without asking anyone for help.</p>
        <Steps
          items={[
            "On a computer, look at the left-hand menu. There's a \"Change Password\" button near the bottom, under your name.",
            "On a phone, look at the top of the screen for a \"Password\" button.",
            "Click it, enter your current password and your new password, and save.",
          ]}
        />
      </Section>

      <Section title="Logging out">
        <p>When you're done using the app, it's good practice to log out, especially on a shared phone or computer.</p>
        <Steps
          items={[
            "On a computer, the \"Log out\" button is at the bottom of the left-hand menu.",
            "On a phone, the \"Log out\" button is at the top of the screen.",
          ]}
        />
      </Section>

      <p className="text-center text-xs text-clay-400 pt-2">
        Still unsure about something? Ask any family member who's used the app before.
        Everyone can see the same information, so there's always someone who can help.
      </p>
    </div>
  );
}
