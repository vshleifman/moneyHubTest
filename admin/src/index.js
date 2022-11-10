const express = require("express")
const bodyParser = require("body-parser")
const config = require("config")
const axios = require("axios")

const app = express()

app.use(bodyParser.json({limit: "10mb"}))

app.get("/", (req, res) => {
  console.log(req)
  res.send("hi")
})

app.get("/investments/:id", async (req, res) => {
  const {id} = req.params
  try {
    const investment = await axios.get(`${config.investmentsServiceUrl}/investments/${id}`)
    res.status(200)
    res.send(investment.data)
  } catch (error) {
    console.log(error)
    res.status(500)
    res.send(error)
  }
})

app.listen(config.port, (err) => {
  if (err) {
    console.error("Error occurred starting the server", err)
    process.exit(1)
  }
  console.log(`Server running on port ${config.port}`)
})
