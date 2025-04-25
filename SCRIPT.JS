document.addEventListener('DOMContentLoaded', () => {
    const dateInput = document.getElementById('date');
    const categoryInput = document.getElementById('category');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const addExpenseButton = document.getElementById('add-expense');
    const expenseTableBody = document.getElementById('expense-table-body');
    const totalExpensesSpan = document.getElementById('total-expenses');
    const remainingBudgetSpan = document.getElementById('remaining-budget');
    const budgetInput = document.getElementById('budget-input');
    const setBudgetButton = document.getElementById('set-budget');
    const currentBudgetSpan = document.getElementById('current-budget');

    const nameInput = document.getElementById('name');
    const currencyInput = document.getElementById('currency');
    const savingsGoalInput = document.getElementById('savings-goal');
    const saveProfileButton = document.getElementById('save-profile');

    const displayName = document.getElementById('display-name');
    const displayCurrency = document.getElementById('display-currency');
    const displaySavingsGoal = document.getElementById('display-savings-goal');

    const goalNameInput = document.getElementById('goal-name');
    const goalAmountInput = document.getElementById('goal-amount');
    const goalDeadlineInput = document.getElementById('goal-deadline'); // New element
    const addGoalButton = document.getElementById('add-goal');
    const goalsContainer = document.getElementById('goals');

    const budgetProgressBar = document.getElementById('budget-progress-bar');
    const chartCtx = document.getElementById('expenseIncomeChart').getContext('2d');
    let expenseIncomeChart;

    let budget = parseFloat(localStorage.getItem('budget')) || 0;
    let expenses = JSON.parse(localStorage.getItem('expenses')) || [];
    let goals = JSON.parse(localStorage.getItem('goals')) || [];
    let editingExpenseIndex = null;
    let editingGoalIndex = null;

    const categoryColors = {
        Food: '#ffcdd2',
        Books: '#bbdefb',
        Rent: '#c8e6c9',
        Entertainment: '#fff9c4',
        Other: '#d1c4e9'
    };

    function displayProfile(profile) {
        nameInput.value = profile.name || '';
        currencyInput.value = profile.currency || 'USD';
        savingsGoalInput.value = profile.savingsGoal || '';

        displayName.textContent = profile.name || 'Not set';
        displayCurrency.textContent = profile.currency || 'Not set';
        displaySavingsGoal.textContent = profile.savingsGoal ? parseFloat(profile.savingsGoal).toFixed(2) : 'Not set';
    }

    function renderGoals() {
        goalsContainer.innerHTML = '';
        goals.forEach((goal, index) => {
            const goalCard = document.createElement('div');
            goalCard.classList.add('goal-card');
            goalCard.innerHTML = `
                <h4>${goal.name}</h4>
                <p>Amount: ${goal.amount.toFixed(2)}</p>
                <p>Target Date: ${goal.deadline || 'Not set'}</p>
                <p id="goal-progress-${index}"></p>
                <button class="delete-goal" data-index="${index}">Delete</button>
                <button class="edit-goal" data-index="${index}">Edit</button>
            `;
            goalsContainer.appendChild(goalCard);

            updateGoalProgress(goal, index); // Call the new function
        });

        const deleteGoalButtons = document.querySelectorAll('.delete-goal');
        deleteGoalButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const index = parseInt(event.target.dataset.index);
                goals.splice(index, 1);
                localStorage.setItem('goals', JSON.stringify(goals));
                renderGoals();
            });
        });

        const editGoalButtons = document.querySelectorAll('.edit-goal');
        editGoalButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const index = parseInt(event.target.dataset.index);
                editingGoalIndex = index;
                const goal = goals[index];
                goalNameInput.value = goal.name;
                goalAmountInput.value = goal.amount;
                goalDeadlineInput.value = goal.deadline || ''; // Populate deadline for editing
                addGoalButton.textContent = 'Update Goal';
            });
        });
    }

    function updateGoalProgress(goal, index) {
        const progressElement = document.getElementById(`goal-progress-${index}`);
        if (goal.deadline) {
            const deadline = new Date(goal.deadline);
            const now = new Date();
            const timeLeft = deadline.getTime() - now.getTime();
            const daysLeft = Math.ceil(timeLeft / (1000 * 60 * 60 * 24));

            if (daysLeft > 0) {
                progressElement.textContent = `${daysLeft} days left`;
            } else if (daysLeft === 0) {
                progressElement.textContent = 'Deadline today!';
            } else {
                progressElement.textContent = `Deadline passed ${Math.abs(daysLeft)} days ago`;
            }
        } else {
            progressElement.textContent = 'No deadline set';
        }
    }

    function displayWarning(message) {
        alert(message);
    }

    function renderExpenses() {
        expenseTableBody.innerHTML = '';
        let total = 0;

        expenses.forEach((expense, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${expense.date}</td>
                <td>${expense.category}</td>
                <td>${expense.description}</td>
                <td>${expense.amount}</td>
                <td><button class="delete-expense-btn" data-index="${index}">Delete</button></td>
                <td><button class="edit-expense-btn" data-index="${index}">Edit</button></td>
            `;
            row.style.backgroundColor = categoryColors[expense.category];
            expenseTableBody.appendChild(row);
            total += parseFloat(expense.amount);
        });

        totalExpensesSpan.textContent = total.toFixed(2);
        const remainingBudget = budget - total;
        remainingBudgetSpan.textContent = remainingBudget.toFixed(2);

        if (budget > 0) {
            const progress = (total / budget) * 100;
            budgetProgressBar.style.width = `${Math.min(progress, 100)}%`;

            if (progress > 80) {
                budgetProgressBar.style.backgroundColor = '#f44336';
            } else if (progress > 50) {
                budgetProgressBar.style.backgroundColor = '#ffc107';
            } else {
                budgetProgressBar.style.backgroundColor = '#4caf50';
            }

            if (remainingBudget < 0) {
                displayWarning('You have exceeded your budget!');
            } else if (progress > 90) {
                displayWarning('You are nearing your budget limit!');
            }
        } else {
            budgetProgressBar.style.width = '0%';
        }
        updateChart();
    }

    function updateChart() {
        if (expenseIncomeChart) {
            expenseIncomeChart.destroy();
        }
        if (!chartCtx) return;

        const labels = expenses.map(expense => expense.description);
        const data = expenses.map(expense => expense.amount);

        // Generate an array of random RGB colors
        const backgroundColors = data.map(() => {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            return `rgb(${r},${g},${b})`;
        });

        // Make border colors black
        const borderColors = 'black';

        expenseIncomeChart = new Chart(chartCtx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Expenses',
                    data: data,
                    backgroundColor: backgroundColors,
                    borderColor: borderColors,
                    borderWidth: 3
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                },
                responsive: true,
                maintainAspectRatio: true,
            }
        });
    }

    currentBudgetSpan.textContent = budget.toFixed(2);
    renderExpenses();
    renderGoals();

    const profile = JSON.parse(localStorage.getItem('profile')) || {};
    displayProfile(profile);
    updateChart();

    setBudgetButton.addEventListener('click', () => {
        const budgetValue = budgetInput.value.trim();

        if (budgetValue && !isNaN(parseFloat(budgetValue))) {
            budget = parseFloat(budgetValue);
            localStorage.setItem('budget', budget);
            currentBudgetSpan.textContent = budget.toFixed(2);
            renderExpenses();
            budgetInput.value = "";
        } else {
            displayWarning('Please enter a valid number for the budget.');
        }
    });

    addExpenseButton.addEventListener('click', () => {
        const date = dateInput.value;
        const category = categoryInput.value;
        const description = descriptionInput.value;
        const amount = parseFloat(amountInput.value);

        if (date && category && description && !isNaN(amount)) {
            if (editingExpenseIndex !== null) {
                expenses[editingExpenseIndex] = { date, category, description, amount };
                editingExpenseIndex = null;
                addExpenseButton.textContent = 'Add Expense';
            } else {
                expenses.push({ date, category, description, amount });
            }
            localStorage.setItem('expenses', JSON.stringify(expenses));
            renderExpenses();
            dateInput.value = '';
            descriptionInput.value = '';
            amountInput.value = '';
        } else {
            displayWarning('Please fill in all fields with valid data.');
        }
    });

    expenseTableBody.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-expense-btn')) {
            const index = parseInt(event.target.dataset.index);
            expenses.splice(index, 1);
            localStorage.setItem('expenses', JSON.stringify(expenses));
            renderExpenses();
        } else if (event.target.classList.contains('edit-expense-btn')) {
            editingExpenseIndex = parseInt(event.target.dataset.index);
            const expense = expenses[editingExpenseIndex];
            dateInput.value = expense.date;
            categoryInput.value = expense.category;
            descriptionInput.value = expense.description;
            amountInput.value = expense.amount;
            addExpenseButton.textContent = 'Update Expense';
        }
    });

    saveProfileButton.addEventListener('click', () => {
        const profileData = {
            name: nameInput.value,
            currency: currencyInput.value,
            savingsGoal: parseFloat(savingsGoalInput.value) || 0,
        };
        localStorage.setItem('profile', JSON.stringify(profileData));
        displayProfile(profileData);
        alert('Profile saved!');
    });

    addGoalButton.addEventListener('click', () => {
        const goalName = goalNameInput.value;
        const goalAmount = parseFloat(goalAmountInput.value);
        const goalDeadline = goalDeadlineInput.value; // Get the deadline

        if (goalName && !isNaN(goalAmount)) {
            const newGoal = { name: goalName, amount: goalAmount, deadline: goalDeadline }; // Include deadline
            if (editingGoalIndex !== null) {
                goals[editingGoalIndex] = newGoal;
                editingGoalIndex = null;
                addGoalButton.textContent = 'Add Goal';
            } else {
                goals.push(newGoal);
            }
            localStorage.setItem('goals', JSON.stringify(goals));
            renderGoals();
            goalNameInput.value = '';
            goalAmountInput.value = '';
            goalDeadlineInput.value = ''; // Reset deadline input
        } else {
            displayWarning('Please enter a goal name and a valid amount.');
        }
    });

    goalsContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-goal-btn')) {
            const index = parseInt(event.target.dataset.index);
            goals.splice(index, 1);
            localStorage.setItem('goals', JSON.stringify(goals));
            renderGoals();
        } else if (event.target.classList.contains('edit-goal-btn')) {
            editingGoalIndex = parseInt(event.target.dataset.index);
            const goal = goals[editingGoalIndex];
            goalNameInput.value = goal.name;
            goalAmountInput.value = goal.amount;
            goalDeadlineInput.value = goal.deadline || ''; // Populate deadline for editing
            addGoalButton.textContent = 'Update Goal';
        }
    });

    // Call renderGoals again to ensure deadlines are displayed on load
    renderGoals();
});