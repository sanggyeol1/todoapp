import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import TodoBoard from "./components/TodoBoard";
import api from "./utils/api"
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";
import { useEffect, useState } from "react";

function App() {
  const [todoList, setTodoList] = useState([])
  const [todoValue, setTodoValue] = useState("")

  const getTasks = async () => {
    const response = await api.get("/tasks")
    // console.log(response)
    setTodoList(response.data.data)
  }

  const addTask = async () => {
    try {
        const response = await api.post('/tasks', { task: todoValue, isComplete: false })
        if (response.status == 200) {
          console.log("task add success")
        } else {
          throw new Error("task cannot be added")
        }
    } catch (err) {
      console.log('error', err)
    }
  }

  const deleteTask = async (id) => {
    try {
      const response = await api.delete('/tasks/' + id)
      if (response.status == 200) {
        console.log("task delete success")
      } else {
        throw new Error("task cannot be deleted")
      }
    } catch (err) {
      console.log('error', err)
    }
  }

  const updateTask = async (id, isComplete) => {
    try{
      const response = await api.put('/tasks/' + id)
      if (response.status == 200) {
        console.log("task update success")
      } else {
        throw new Error("task cannot be updated")
      }
    }catch (err) {
      console.log('error', err)
    }
  }


  useEffect(() => {
    getTasks()
  }, [])

  return (
    <Container>
      <Row className="add-item-row">
        <Col xs={12} sm={10}>
          <input
            value={todoValue}
            onChange={(e) => setTodoValue(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                setTodoValue("")
                await addTask()
                getTasks()
              }
            }}
            type="text"
            placeholder="할일을 입력하세요"
            className="input-box"

          />
        </Col>
        <Col xs={12} sm={2}>
          <button
            onClick={async () => {
              setTodoValue("")
              await addTask()
              getTasks() //다시 전체 리스트 불러옴
            }}
            className="button-add">추가</button>
        </Col>
      </Row>

      <TodoBoard todoList={todoList} deleteTask={deleteTask} getTasks={getTasks} updateTask={updateTask} />
    </Container>
  );
}

export default App;
