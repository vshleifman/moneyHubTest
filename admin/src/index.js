const express = require("express")
const bodyParser = require("body-parser")
const config = require("config")
const axios = require("axios")
const {parse} = require("json2csv")

const app = express()

app.use(bodyParser.json({limit: "10mb"}))

const extractData = (investments, holdings, onlyLatest) => {
  const dataToParse = {}

  for (let i = 0; i < investments.data.length; i += 1) {
    for (let j = 0; j < investments.data[i].holdings.length; j += 1) {
      const user = investments.data[i]
      dataToParse[`${user.userId}${user.holdings[j].id}${onlyLatest ? "" : i + j}`] = {
        "User": user.userId,
        "First Name": user.firstName,
        "Last Name": user.lastName,
        "Date": user.date,
        "Holding": holdings.data[user.holdings[j].id - 1].name,
        "Value": user.holdings[j].investmentPercentage * user.investmentTotal,
      }
    }
  }
  return dataToParse
}

app.get("/report/:latest?", async (req, res) => {

  const latest = req.params.latest
  try {
    const investments = await axios.get(`${config.investmentsServiceUrl}/investments`)
    const holdings = await axios.get(`${config.holdingsServiceUrl}/companies`)
    holdings.data.sort((a, b) => a.id > b.id)

    const dataToParse = extractData(investments, holdings, !!latest)

    const dataToExport = Object.values(dataToParse)
    const fields = Object.keys(dataToExport[0])

    const csv = parse(dataToExport, {fields})

    const result = await axios.post(`${config.investmentsServiceUrl}/investments/export`, {csv})

    res.status(result.status)
    res.send(result.data)

  } catch (error) {
    res.status(500)
    res.send(error)
  }
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
