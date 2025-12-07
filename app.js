// アプリケーションの状態管理
class TodoApp {
    constructor() {
        this.todos = this.loadTodos();
        this.currentFilter = 'all';
        this.init();
    }

    // 初期化
    init() {
        this.cacheDOMElements();
        this.bindEvents();
        this.render();
    }

    // DOM要素のキャッシュ
    cacheDOMElements() {
        this.todoInput = document.getElementById('todoInput');
        this.addBtn = document.getElementById('addBtn');
        this.todoList = document.getElementById('todoList');
        this.filterBtns = document.querySelectorAll('.filter-btn');
        this.clearCompletedBtn = document.getElementById('clearCompleted');
        this.todoCount = document.getElementById('todoCount');
    }

    // イベントバインディング
    bindEvents() {
        // TODO追加
        this.addBtn.addEventListener('click', () => this.addTodo());
        this.todoInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTodo();
        });

        // フィルター切り替え
        this.filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentFilter = e.target.dataset.filter;
                this.updateFilterUI();
                this.render();
            });
        });

        // 完了済み削除
        this.clearCompletedBtn.addEventListener('click', () => this.clearCompleted());
    }

    // TODO追加
    addTodo() {
        const text = this.todoInput.value.trim();
        if (!text) return;

        const todo = {
            id: Date.now(),
            text: text,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.todos.push(todo);
        this.saveTodos();
        this.todoInput.value = '';
        this.render();
    }

    // TODO削除
    deleteTodo(id) {
        this.todos = this.todos.filter(todo => todo.id !== id);
        this.saveTodos();
        this.render();
    }

    // 完了状態の切り替え
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveTodos();
            this.render();
        }
    }

    // TODO編集
    editTodo(id, newText) {
        const todo = this.todos.find(t => t.id === id);
        if (todo && newText.trim()) {
            todo.text = newText.trim();
            this.saveTodos();
            this.render();
        }
    }

    // 完了済みタスクを削除
    clearCompleted() {
        this.todos = this.todos.filter(todo => !todo.completed);
        this.saveTodos();
        this.render();
    }

    // フィルタリングされたTODOを取得
    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(todo => !todo.completed);
            case 'completed':
                return this.todos.filter(todo => todo.completed);
            default:
                return this.todos;
        }
    }

    // フィルターUIの更新
    updateFilterUI() {
        this.filterBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === this.currentFilter);
        });
    }

    // レンダリング
    render() {
        const filteredTodos = this.getFilteredTodos();
        this.todoList.innerHTML = '';

        if (filteredTodos.length === 0) {
            this.renderEmptyState();
        } else {
            filteredTodos.forEach(todo => {
                const todoItem = this.createTodoElement(todo);
                this.todoList.appendChild(todoItem);
            });
        }

        this.updateStats();
    }

    // 空の状態を表示
    renderEmptyState() {
        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-state';

        let message = '';
        switch (this.currentFilter) {
            case 'active':
                message = '<p>未完了のタスクはありません</p><p>新しいタスクを追加してください</p>';
                break;
            case 'completed':
                message = '<p>完了したタスクはありません</p><p>タスクを完了してみましょう</p>';
                break;
            default:
                message = '<p>タスクがありません</p><p>上の入力欄から新しいタスクを追加してください</p>';
        }

        emptyDiv.innerHTML = message;
        this.todoList.appendChild(emptyDiv);
    }

    // TODO要素を作成
    createTodoElement(todo) {
        const li = document.createElement('li');
        li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
        li.dataset.id = todo.id;

        // チェックボックス
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'todo-checkbox';
        checkbox.checked = todo.completed;
        checkbox.addEventListener('change', () => this.toggleTodo(todo.id));

        // テキスト
        const span = document.createElement('span');
        span.className = 'todo-text';
        span.textContent = todo.text;

        // ダブルクリックで編集
        span.addEventListener('dblclick', () => {
            this.startEditing(span, todo.id);
        });

        // アクション
        const actions = document.createElement('div');
        actions.className = 'todo-actions';

        // 編集ボタン
        const editBtn = document.createElement('button');
        editBtn.className = 'btn-icon btn-edit';
        editBtn.textContent = '✏️';
        editBtn.title = '編集';
        editBtn.addEventListener('click', () => {
            this.startEditing(span, todo.id);
        });

        // 削除ボタン
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-icon btn-delete';
        deleteBtn.textContent = '🗑️';
        deleteBtn.title = '削除';
        deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));

        actions.appendChild(editBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(actions);

        return li;
    }

    // 編集開始
    startEditing(span, id) {
        const originalText = span.textContent;
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'todo-text editing';
        input.value = originalText;

        // 編集完了
        const finishEdit = () => {
            const newText = input.value.trim();
            if (newText && newText !== originalText) {
                this.editTodo(id, newText);
            } else {
                this.render();
            }
        };

        // イベント
        input.addEventListener('blur', finishEdit);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') finishEdit();
        });
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.render();
        });

        // 置き換え
        span.replaceWith(input);
        input.focus();
        input.select();
    }

    // 統計情報の更新
    updateStats() {
        const totalCount = this.todos.length;
        const activeCount = this.todos.filter(t => !t.completed).length;
        const completedCount = totalCount - activeCount;

        let countText = `${totalCount} 件のタスク`;
        if (totalCount > 0) {
            countText += ` (未完了: ${activeCount}, 完了: ${completedCount})`;
        }

        this.todoCount.textContent = countText;

        // 完了済み削除ボタンの表示制御
        this.clearCompletedBtn.style.visibility = completedCount > 0 ? 'visible' : 'hidden';
    }

    // LocalStorageに保存
    saveTodos() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    // LocalStorageから読み込み
    loadTodos() {
        const data = localStorage.getItem('todos');
        return data ? JSON.parse(data) : [];
    }
}

// アプリケーション起動
document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});
