"use strict";

// clients do not see global variables
// -> closure is used
(function () {
  const url_users_5 = "https://jsonplaceholder.typicode.com/users?_limit=5";
  const url_todos_5 = "https://jsonplaceholder.typicode.com/todos?_limit=5";
  const url_todos = "https://jsonplaceholder.typicode.com/todos";
  let TODOS = [];
  let USERS = [];

  const doRequest = async (url, method, body = "") => {
    try {
      let resp;
      if (method === "GET") {
        resp = await fetch(url, { method: method });
      } else {
        resp = await fetch(url, { method: method, body: body });
      }
      if (resp.ok) {
        resp = await resp.json();
        console.log("reply from server :", resp);
        return resp;
      }
      // e.g. 404
      throw new Error("response does not have status OK");
    } catch (error) {
      console.error(error.message);
    }
  };

  const insertTodo = (todo, user) => {
    const todoItem = document.createElement("li");
    todoItem.dataset.id = todo.id;

    const text = document.createElement("span");
    text.innerHTML = `${todo.title} <i>by</i> <b>${user.name}</b>`;

    const checkbox = document.createElement("input");
    checkbox.setAttribute("type", "checkbox");
    checkbox.addEventListener("change", completeTodo);
    checkbox.checked = todo.completed;
    setStrikeText(text, todo.completed);

    const deleteBtn = document.createElement("span");
    deleteBtn.innerHTML = "&times";
    deleteBtn.classList.add("close");
    deleteBtn.addEventListener("click", deleteTodo);

    todoItem.appendChild(checkbox);
    todoItem.appendChild(text);
    todoItem.appendChild(deleteBtn);

    todoItem.classList.add("todo-item");
    const list = document.querySelector("#todo-list");
    list.prepend(todoItem);
  };

  const getUserByTodo = (todo) => {
    let user = USERS.find((user) => user.id == todo.userId);
    if (!user) {
      console.error(todo.userId);
      console.error(USERS);
      throw new Error("not found user");
    }
    return user;
  };

  const showTodos = () => {
    for (let todo of TODOS) {
      const user = getUserByTodo(todo);
      insertTodo(todo, user);
    }
  };

  const insertUsers = () => {
    const list = document.querySelector("#user-todo");
    for (let user of USERS) {
      const userElem = document.createElement("option");
      userElem.innerHTML = user.name;
      userElem.dataset.id = user.id;
      list.appendChild(userElem);
    }
  };

  const setStrikeText = (textNode, yes) => {
    if (yes) {
      textNode.classList.add("strikeText");
      return;
    }
    textNode.classList.remove("strikeText");
  };

  // events

  const completeTodo = (event) => {
    const text = event.target.nextElementSibling;
    if (event.target.checked) {
      setStrikeText(text, true);
      return;
    }
    // PATCH request to change status of task
    setStrikeText(text, false);
  };

  const deleteTodo = (event) => {
    let delTodoNode = event.target.parentElement;
    // how to remove node and all its events handles and its child's events handles
    delTodoNode
      .querySelector("input")
      .removeEventListener("change", completeTodo);
    delTodoNode
      .querySelector(".close")
      .removeEventListener("click", deleteTodo);

    let delTodo;
    let delTodoIndex;
    for (let [index, todo] of TODOS.entries()) {
      if (todo.id === Number(delTodoNode.dataset.id)) {
        delTodo = todo;
        delTodoIndex = index;
        break;
      }
    }

    doRequest(
      url_todos + "/" + String(delTodo.id),
      "DELETE",
      JSON.stringify(delTodo)
    ).then((resp) => {
      // удаление 1 элемента, начиная с index
      TODOS.splice(delTodoIndex, 1);
      delTodoNode.remove();
    });
  };

  const initApp = (event) => {
    Promise.all([
      doRequest(url_users_5, "GET"),
      doRequest(url_todos_5, "GET"),
    ]).then((values) => {
      [USERS, TODOS] = values;
      showTodos();
      insertUsers();
    });
  };

  const addTodo = (event) => {
    event.preventDefault();
    const inputText = document.querySelector("input").value;
    const usersNode = document.querySelector("#user-todo");
    const selectedUser = usersNode.options[usersNode.selectedIndex];
    if (selectedUser.getAttribute("disabled") == "" || inputText == "") {
      alert("User not chosen or text not entered");
      return;
    }
    const maxId = TODOS.reduce(
      (max, todo) => (todo.id > max ? todo.id : max),
      0
    );
    const newTodo = {
      userId: Number(selectedUser.dataset.id),
      id: maxId + 1,
      title: inputText,
      completed: false,
    };
    doRequest(
      url_todos + "/" + String(maxId),
      "POST",
      JSON.stringify(newTodo)
    ).then((resp) => {
      // resp ignored
      TODOS.push(newTodo);
      const user = getUserByTodo(newTodo);
      insertTodo(newTodo, user);
    });
  };

  document.addEventListener("DOMContentLoaded", initApp);
  document.querySelector("button").addEventListener("click", addTodo);
})();
