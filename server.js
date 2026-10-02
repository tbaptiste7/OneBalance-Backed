const express = require("express");
const {
Configuration,
PlaidApi,
PlaidEnvironments,
Products,
CountryCode
} = require("plaid");

const app = express();
app.use(express.json());
app.get("/.well-known/apple-app-site-association", (req, res) => {
  res.json({
    applinks: {
      details: [
        {
          appIDs: ["S9357QV94N.com.example.OneBalance"],
          components: [
            { "/": "/plaid/oauth-return" }
          ]
        }
      ]
    }
  });
});

app.get("/plaid/oauth-return", (req, res) => {
  res.type("html").send(
    "<!doctype html><html><body><p>Return to OneBalance to continue connecting your account.</p></body></html>"
  );
});
const configuration = new Configuration({
basePath: PlaidEnvironments.sandbox,
baseOptions: {
headers: {
"PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
"PLAID-SECRET": process.env.PLAID_SECRET
}
}
});

const plaidClient = new PlaidApi(configuration);

app.get("/", (req, res) => {
res.json({
status: "ok",
app: "OneBalance Backend"
});
});

app.post("/api/plaid/create-link-token", async (req, res) => {
try {
const response = await plaidClient.linkTokenCreate({
user: {
client_user_id: "onebalance-test-user"
},
client_name: "OneBalance",
products: [Products.Transactions],
country_codes: [CountryCode.Us],
language: "en",
redirect_uri: "https://onebalance-backed.onrender.com/plaid/oauth-return",

hosted_link: {
  completion_redirect_uri: "onebalance://hosted-link-complete",
  is_mobile_app: true
}
});

res.json({
hosted_link_url: response.data.hosted_link_url,
link_token: response.data.link_token
});
} catch (error) {
console.error(
"Plaid error:",
error.response?.data || error.message
);

res.status(500).json({
error: "Unable to create Hosted Link"
});
}
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
console.log(`OneBalance backend running on port ${PORT}`);
});

