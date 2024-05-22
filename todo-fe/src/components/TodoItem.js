import React from "react";
import { Col, Row } from "react-bootstrap";

const TodoItem = ({item, deleteTask, getTasks, updateTask}) => {

  return (
    <Row>
      <Col xs={12}>
        <div 
          style={{
            background:
              item.isComplete == true 
              ? "grey" :"white" }} className={`todo-item`}>
          <div className="todo-content">{item.task}</div>

          <div>
            <button onClick={async ()=> {
              await deleteTask(item._id)
              getTasks()
            }} className="button-delete">삭제</button>
            <button onClick={async()=>{
              await updateTask(item._id, item.isComplete)
              getTasks()
            }} className="button-delete">끝남</button>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default TodoItem;
