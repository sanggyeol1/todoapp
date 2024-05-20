const Task = require("../model/Task")
const { ObjectId } = require('mongodb');

const taskController = {}

taskController.createTask = async (req, res) => {
    try {
        const { task, isComplete } = req.body;
        const newTask = new Task({ task, isComplete })
        await newTask.save();
        res.status(200).json({ status: "ok", data: newTask })
    } catch (err) {
        res.status(400).json({ status: "fail", error: err })
    }
}

taskController.getTask = async (req, res) => {
    try {
        const taskList = await Task.find({}).select("-__v")
        res.status(200).json({ status: "ok", data: taskList })
    } catch (err) {
        res.status(400).json({ status: "fail", error: err })
    }
}

taskController.deleteTask = async (req, res) => {
    try {
        const taskId = new ObjectId(req.params.id)
        const result = await Task.deleteOne({ _id: taskId });
        if (result.deletedCount === 0) {
            return res.status(404).json({ status: "fail", error: "Task not found" });
        }
        res.status(200).json({ status: "ok", data: result })
    } catch (err) {
        res.status(400).json({ status: "fail", error: err })
    }
}

taskController.updateTask = async (req, res) => {
    try {
        const taskId = new ObjectId(req.params.id)
        const task = await Task.findOne({ _id: taskId })
        const newStatus = !task.isComplete;

        const result = await Task.updateOne({ _id: taskId }, { $set: { isComplete: newStatus } });
        if (result.modifiedCount === 0) {
            return res.status(404).json({ status: "fail", error: "Task not found" });
        }
        res.status(200).json({ status: "ok", data: result })
    } catch (err) {
        res.status(400).json({ status: "fail", error: err })
    }
}


module.exports = taskController