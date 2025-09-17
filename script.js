document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const taskInput = document.getElementById('task-input');
    const addTaskBtn = document.getElementById('add-task-btn');
    const taskDate = document.getElementById('task-date');
    const taskTime = document.getElementById('task-time');
    const taskCategory = document.getElementById('task-category');
    const taskNotes = document.getElementById('task-notes');
    const tasksList = document.getElementById('tasks-list');
    const searchInput = document.getElementById('search-input');
    const filterBtns = document.querySelectorAll('.filter-btn');
    const categoryFilters = document.querySelectorAll('.category-filter');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const tasksCount = document.getElementById('tasks-count');
    const totalTasks = document.getElementById('total-tasks');
    const activeTasks = document.getElementById('active-tasks');
    const completedTasks = document.getElementById('completed-tasks');
    
    // Edit Modal Elements
    const editModal = document.getElementById('edit-task-modal');
    const closeEditModal = document.getElementById('close-edit-modal');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const editTaskInput = document.getElementById('edit-task-input');
    const editTaskDate = document.getElementById('edit-task-date');
    const editTaskTime = document.getElementById('edit-task-time');
    const editTaskCategory = document.getElementById('edit-task-category');
    const editTaskNotes = document.getElementById('edit-task-notes');
    const updateTaskBtn = document.getElementById('update-task-btn');
    
    // State variables
    let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
    let currentFilter = 'all';
    let currentCategoryFilter = 'all';
    let searchQuery = '';
    let currentEditId = null;
    
    // Initialize the app
    function init() {
        // Set today's date as default
        const today = new Date().toISOString().split('T')[0];
        taskDate.value = today;
        
        // Add event listeners
        addTaskBtn.addEventListener('click', addTask);
        taskInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addTask();
        });
        
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase();
            renderTasks();
        });
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentFilter = btn.dataset.filter;
                renderTasks();
            });
        });
        
        categoryFilters.forEach(btn => {
            btn.addEventListener('click', () => {
                currentCategoryFilter = btn.dataset.category;
                renderTasks();
            });
        });
        
        clearCompletedBtn.addEventListener('click', clearCompletedTasks);
        
        // Modal event listeners
        closeEditModal.addEventListener('click', () => {
            editModal.classList.remove('active');
        });
        
        cancelEditBtn.addEventListener('click', () => {
            editModal.classList.remove('active');
        });
        
        updateTaskBtn.addEventListener('click', updateTask);
        
        // Close modal when clicking outside
        editModal.addEventListener('click', (e) => {
            if (e.target === editModal) {
                editModal.classList.remove('active');
            }
        });
        
        // Load tasks from localStorage
        renderTasks();
        updateStats();
    }
    
    // Add a new task
    function addTask() {
        const title = taskInput.value.trim();
        if (title === '') return;
        
        const newTask = {
            id: Date.now(),
            title,
            completed: false,
            date: taskDate.value,
            time: taskTime.value,
            category: taskCategory.value,
            notes: taskNotes.value,
            createdAt: new Date().toISOString()
        };
        
        tasks.unshift(newTask);
        saveTasks();
        renderTasks();
        updateStats();
        
        // Reset form
        taskInput.value = '';
        taskNotes.value = '';
        const today = new Date().toISOString().split('T')[0];
        taskDate.value = today;
        taskTime.value = '';
        taskCategory.value = 'personal';
        
        // Focus back to input
        taskInput.focus();
    }
    
    // Render tasks based on filters
    function renderTasks() {
        let filteredTasks = tasks;
        
        // Apply search filter
        if (searchQuery) {
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(searchQuery) ||
                task.notes.toLowerCase().includes(searchQuery)
            );
        }
        
        // Apply status filter
        if (currentFilter === 'active') {
            filteredTasks = filteredTasks.filter(task => !task.completed);
        } else if (currentFilter === 'completed') {
            filteredTasks = filteredTasks.filter(task => task.completed);
        }
        
        // Apply category filter
        if (currentCategoryFilter !== 'all') {
            filteredTasks = filteredTasks.filter(task => task.category === currentCategoryFilter);
        }
        
        // Clear tasks list
        tasksList.innerHTML = '';
        
        // Show empty state if no tasks
        if (filteredTasks.length === 0) {
            tasksList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-clipboard-list"></i>
                    <h3>No tasks found</h3>
                    <p>${tasks.length === 0 ? 'Add a task to get started!' : 'Try changing your filters or search query'}</p>
                </div>
            `;
            return;
        }
        
        // Render tasks
        filteredTasks.forEach(task => {
            const taskElement = document.createElement('div');
            taskElement.className = `task-item ${task.completed ? 'completed' : ''}`;
            taskElement.setAttribute('data-category', task.category);
            taskElement.setAttribute('data-id', task.id);
            
            // Format date and time for display
            const displayDate = task.date ? new Date(task.date).toLocaleDateString() : 'No date';
            const displayTime = task.time || 'No time';
            
            taskElement.innerHTML = `
                <div class="task-checkbox">
                    <input type="checkbox" ${task.completed ? 'checked' : ''}>
                </div>
                <div class="task-content">
                    <div class="task-title">${task.title}</div>
                    <div class="task-details-text">
                        <span class="task-detail"><i class="fas fa-calendar"></i> ${displayDate}</span>
                        <span class="task-detail"><i class="fas fa-clock"></i> ${displayTime}</span>
                        <span class="task-detail"><i class="fas fa-tag"></i> ${task.category}</span>
                    </div>
                    ${task.notes ? `<div class="task-notes">${task.notes}</div>` : ''}
                </div>
                <div class="task-actions">
                    <button class="task-btn edit"><i class="fas fa-edit"></i></button>
                    <button class="task-btn delete"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            tasksList.appendChild(taskElement);
            
            // Add event listeners to the task
            const checkbox = taskElement.querySelector('input[type="checkbox"]');
            const editBtn = taskElement.querySelector('.edit');
            const deleteBtn = taskElement.querySelector('.delete');
            
            checkbox.addEventListener('change', () => toggleTaskComplete(task.id));
            editBtn.addEventListener('click', () => openEditModal(task));
            deleteBtn.addEventListener('click', () => deleteTask(task.id));
        });
        
        tasksCount.textContent = `(${filteredTasks.length})`;
    }
    
    // Toggle task completion status
    function toggleTaskComplete(id) {
        tasks = tasks.map(task => {
            if (task.id === id) {
                return { ...task, completed: !task.completed };
            }
            return task;
        });
        
        saveTasks();
        renderTasks();
        updateStats();
    }
    
    // Open edit modal with task data
    function openEditModal(task) {
        currentEditId = task.id;
        editTaskInput.value = task.title;
        editTaskDate.value = task.date;
        editTaskTime.value = task.time;
        editTaskCategory.value = task.category;
        editTaskNotes.value = task.notes;
        
        editModal.classList.add('active');
    }
    
    // Update task with edited data
    function updateTask() {
        if (!currentEditId) return;
        
        tasks = tasks.map(task => {
            if (task.id === currentEditId) {
                return {
                    ...task,
                    title: editTaskInput.value.trim(),
                    date: editTaskDate.value,
                    time: editTaskTime.value,
                    category: editTaskCategory.value,
                    notes: editTaskNotes.value
                };
            }
            return task;
        });
        
        saveTasks();
        renderTasks();
        editModal.classList.remove('active');
        currentEditId = null;
    }
    
    // Delete a task
    function deleteTask(id) {
        if (!confirm('Are you sure you want to delete this task?')) return;
        
        tasks = tasks.filter(task => task.id !== id);
        saveTasks();
        renderTasks();
        updateStats();
    }
    
    // Clear all completed tasks
    function clearCompletedTasks() {
        if (!confirm('Are you sure you want to clear all completed tasks?')) return;
        
        tasks = tasks.filter(task => !task.completed);
        saveTasks();
        renderTasks();
        updateStats();
    }
    
    // Update statistics
    function updateStats() {
        const total = tasks.length;
        const active = tasks.filter(task => !task.completed).length;
        const completed = tasks.filter(task => task.completed).length;
        
        totalTasks.textContent = total;
        activeTasks.textContent = active;
        completedTasks.textContent = completed;
    }
    
    // Save tasks to localStorage
    function saveTasks() {
        localStorage.setItem('tasks', JSON.stringify(tasks));
    }
    
    // Initialize the app
    init();
});