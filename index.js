<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BuGPT 😈</title>
<style>
  body {
    font-family: 'Arial', sans-serif;
  }

  table {
    width: 70%;
    margin: 0 auto;
    border-collapse: collapse;
  }
  
  th, td {
    padding: 10px;
    text-align: center;
    border: 1px solid black;
    font-family: 'Courier New', monospace;
  }
  .container {
    text-align: center;
    font-family: 'Arial', sans-serif;
    display: flex;
    align-items: center;
    margin-bottom: 20px;
  }

  form {
    text-align: center;
    width: 45%;
    margin-left: 9%;
    font-family: 'Arial', sans-serif;
  }
  
  input[type="text"] {
    padding: 5px;
    width: 30%;
  }
  
  input[type="submit"] {
    padding: 5px 10px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
  }

  .status-online {
    color: green;
    font-weight: bold;
  }
  
  .status-offline {
    color: red;
    font-weight: bold;
  }
  .pagination {
    margin-top: 10px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .page-link {
    display: inline-block;
    padding: 5px 10px;
    background-color: #4CAF50;
    color: white;
    border: none;
    cursor: pointer;
    margin: 0 5px;
  }
  .page-link.current-page {
    background-color: red;
  }
  #result {
    margin-left: -100px;
    font-family: 'Arial', sans-serif;
    font-size: 14px;
    text-align: left;
    border: 1px solid #ccc;
    padding: 5px;
  }
  .status {
    margin-left: 20px;
  }
  footer {
    text-align: center; 
    position: fixed; 
    bottom: 0; 
    width: 100%; 
    padding: 10px;
    padding-bottom: 20px;
  }
</style>
</head>
<body>
  <div class="container">
    <form id="tokenForm">
      <label for="inputText">Enter token 💜 :</label>
      <input type="text" id="inputText" name="inputText">
      <input type="submit" value="Submit" id="submitButton">
    </form>
    <div id="result" style="display: none;"></div>
    <div class="status">
      <span>🌐 All : <%= data.length %> |</span>
      <span>✅ Online : <%= counts.trueCount %> |</span>
      <span>⛔ Offline : <%= counts.falseCount %></span>
    </div>
  </div>

  <table>
    <tr>
      <th>#</th>
      <th>token 🔑</th>
      <th>status 🤔</th>
      <th>used 📲</th>
      <th>lastused 🕑</th>
      <th>type 🤖</th>
    </tr>
    <% const pageSize = 10;
       const totalPages = Math.ceil(data.length / pageSize);
       const currentPage = req.query.page || 1;
       const startIdx = (currentPage - 1) * pageSize;
       const endIdx = startIdx + pageSize;
       const pageData = data.slice(startIdx, endIdx);
         
       pageData.forEach((item, index) => { %>
      <tr>
        <td><%= (currentPage - 1) * pageSize + index + 1 %></td>
        <td><%= item.token %></td>
        <td class="<%= item.status ? 'status-online' : 'status-offline' %>">
          <%= item.status ? 'Online' : 'Offline' %>
          <% if (!item.status) { %>
            <br><small>(<%= item.code %>)</small>
          <% } %>
        </td>
        <td><%= item.used %></td>
        <td><%= item.lastused %></td>
        <td><%= item.type %></td>
      </tr>
    <% }); %>
  </table>
  
  
  <div class="pagination">
    <% if (parseInt(currentPage) > 1) { %>
      <span class="page-link" onclick="navigateToPage(<%= parseInt(currentPage) - 1 %>)"><</span>
    <% } %>
    <% for (let i = 1; i <= totalPages; i++) { %>
      <span
      class="page-link <%= parseInt(currentPage) === i ? 'current-page' : '' %>"
      onclick="navigateToPage(<%= i %>)"
    ><%= i %></span>
    <% } %>
    <% if (parseInt(currentPage) < totalPages) { %>
      <span class="page-link next-page" onclick="navigateToPage(<%= parseInt(currentPage) + 1 %>)">&gt;</span>
    <% } %>
  </div>

  <footer>
    Made with ❤️ in Algeria 🌙
  </footer>

  <script>
  function navigateToPage(page) {
  window.location.href = `/?page=${page}`;
}

const tokenForm = document.getElementById('tokenForm');
const resultDiv = document.getElementById('result');
const submitButton = document.getElementById('submitButton');

tokenForm.addEventListener('submit', async function (event) {
  const dummyJson = {
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "user",
        "content": "prompt"
      }
    ]
  };

  event.preventDefault();
  submitButton.disabled = true;
  const inputValue = document.getElementById('inputText').value;
  const tokens = inputValue.split('\n').map(token => token.trim()).filter(token => token !== '');
  const totalTokens = tokens.length;
  let processedTokens = 0;

  tokens.forEach((token) => {
    processedTokens++;
    resultDiv.innerHTML = `Processing token ${processedTokens}/${totalTokens}... 💻`;
    resultDiv.style.display = 'block';
    await delay(1000);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'accept-encoding': 'gzip',
        'authorization': token,
        'connection': 'Keep-Alive',
        'content-type': 'application/json; charset=UTF-8',
        'host': 'api.openai.com',
        'user-agent': 'okhttp/4.10.0'
      },
      body: JSON.stringify(dummyJson)
    });

    resultDiv.innerHTML = `Testing token ${processedTokens}/${totalTokens}... 🔍`;
    await delay(1000);

    if (response.status === 200) {
      resultDiv.innerHTML = `Token ${processedTokens}/${totalTokens} is valid! ☑️🤩`;
      await delay(1000);
      const saveToken = await fetch('/openai/token', {
        method: 'POST',
        headers: {
          'content-type': 'application/json'
        },
        body: JSON.stringify({ token: token })
      });

      const responseJson = await saveToken.json();
      if (responseJson.status === "Done") {
        resultDiv.innerHTML = `Done with token ${processedTokens}/${totalTokens} ✔️`;
      } else if (responseJson.status === "inDB") {
        resultDiv.innerHTML = `Token ${processedTokens}/${totalTokens} already inDB 🔂`;
      }
    } else {
      resultDiv.innerHTML = `Token ${processedTokens}/${totalTokens} failed. Try another token ❌🤕`;
    }
  });
  submitButton.disabled = false;
});

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
  </script>
</body>
</html>
