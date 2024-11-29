const ws = new WebSocket('ws://localhost:3000/myWebsocket');

ws.onopen = () => {
    console.log('Connected to the server');
};

let employeesList = [];

const formEmp = document.getElementById("formEmp");
const name = document.getElementById("name");
const email = document.getElementById("email");
const mobile = document.getElementById("mobile");
const tableBody = document.querySelector("#example tbody");
const submit = document.getElementById("submit");
const contIdEdit = document.getElementById("contIdEdit");

class Employee {
    constructor(id, name, email, mobile) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.mobile = mobile;
    }
    static showHTML(id, name, email, mobile) {
        const trElement = document.createElement("tr");
        trElement.innerHTML = `
            <td>${name}</td>
            <td>${email}</td>
            <td>${mobile}</td>
            <td>
                <button class="edit" data-id=${id}>Edit</button>
                <button class="delete" data-id=${id}>Delete</button>
            </td>
        `;
        tableBody.appendChild(trElement);
    }
    static showAllEmployees() {
        tableBody.innerHTML = '';
        employeesList.forEach(item => {
            Employee.showHTML(item.id, item.name, item.email, item.mobile);
        });
    }
}

formEmp.addEventListener("submit", (e) => {
    e.preventDefault();
    if (!contIdEdit.value) {
        let id = Math.floor(Math.random() * 10000000);
        const newEmp = new Employee(id, name.value, email.value, mobile.value);
        employeesList.push(newEmp);
        Employee.showAllEmployees();
        ws.send(JSON.stringify({ type: 'add', employee: newEmp }));
    } else {
        const id = contIdEdit.value;
        const updatedEmp = new Employee(id, name.value, email.value, mobile.value);
        tableBody.innerHTML = '';
        employeesList = employeesList.map(emp => (emp.id == id ? updatedEmp : emp));
        Employee.showAllEmployees();
        ws.send(JSON.stringify({ type: 'edit', employee: updatedEmp }));
        submit.value = "Store Data";
    }
    name.value = '';
    email.value = '';
    mobile.value = '';
    contIdEdit.value = '';
});

tableBody.addEventListener("click", (e) => {
    if (e.target.classList.contains("delete")) {
        e.target.parentElement.parentElement.remove();
        const id = e.target.getAttribute("data-id");
        ws.send(JSON.stringify({ type: 'delete', id }));
    }

    if (e.target.classList.contains("edit")) {
        const id = e.target.getAttribute("data-id");
        const item = employeesList.find(item => item.id == id);
        name.value = item.name;
        email.value = item.email;
        mobile.value = item.mobile;
        contIdEdit.value = item.id;
        submit.value = "Edit this Employee";
    }
})

ws.onmessage = (event) => {
    Employee.showAllEmployees();
};

ws.onmessage = (event) => {
    const data = JSON.parse(event.data);

    if (data.type === 'sync') {
        employeesList = data.employees;
    } else if (data.type === 'add') {
        employeesList.push(data.employee);
    } else if (data.type === 'edit') {
        employeesList = employeesList.map(emp =>
            emp.id == data.employee.id ? data.employee : emp
        );
    } else if (data.type === 'delete') {
        employeesList = employeesList.filter(emp => emp.id != data.id);
    }

    Employee.showAllEmployees();
};

ws.onclose = () => {
    console.log('Disconnected from the server');
};

