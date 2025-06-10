const { default: axios } = require("axios");

/**
 * Converts a given cURL command string into an Axios request configuration object
 * and executes the request.
 * This function is specifically tailored to handle GET requests with headers and cookies.
 *
 * @param {string} curlCommand The cURL command string to convert.
 * @returns {Promise<object>} A promise that resolves with the Axios response data.
 */
async function curlToAxios(curlCommand) {
  let url = "";
  const headers = {};
  const params = {}; // For URL query parameters

  // 1. Extract URL
  const urlMatch = curlCommand.match(/'(https?:\/\/[^']+)'/);
  if (urlMatch && urlMatch[1]) {
    url = urlMatch[1];
    // Extract query parameters from the URL
    const urlObj = new URL(url);
    url = urlObj.origin + urlObj.pathname; // Base URL without query params
    for (const [key, value] of urlObj.searchParams.entries()) {
      params[key] = value;
    }
  } else {
    throw new Error("Could not find URL in cURL command.");
  }

  // 2. Extract Headers
  const headerRegex = /-H\s+'([^']+)'/g;
  let match;
  while ((match = headerRegex.exec(curlCommand)) !== null) {
    const headerParts = match[1].split(": ");
    if (headerParts.length >= 2) {
      const headerName = headerParts[0];
      const headerValue = headerParts.slice(1).join(": "); // Handle values with colons
      headers[headerName] = headerValue;
    }
  }

  // 3. Extract Cookies (from -b flag)
  const cookieMatch = curlCommand.match(/-b\s+'([^']+)'/);
  if (cookieMatch && cookieMatch[1]) {
    // If a Cookie header is already present, append or merge.
    // For simplicity, we'll just add it to headers. Axios will handle it.
    // Note: For advanced cookie management, you might need a separate library or axios-cookiejar-support
    headers["Cookie"] = cookieMatch[1];
  }

  // Determine HTTP Method (default to GET for this specific cURL, no -X specified)
  // If -X POST or other methods were present, this logic would need to be expanded.
  const method = "GET";

  const config = {
    method: method,
    url: url,
    headers: headers,
    params: params, // Pass query parameters
    // Axios automatically handles JSON data for POST/PUT if Content-Type is application/json
    // For GET requests, 'data' property is typically not used.
  };

  console.log("Generated Axios Config:", JSON.stringify(config, null, 2));

  try {
    const response = await axios(config);
    console.log("API Call Successful (Data preview):", response.data);
    return response.data;
  } catch (error) {
    console.error(
      "API Call Failed:",
      error.response ? error.response.data : error.message
    );
    throw error; // Re-throw to allow caller to handle the error
  }
}

// Your provided cURL command
const providedCurlCommand = `curl 'https://palacenft.com/api/v1/markets/offers?collection_id=8&limit=40&offset=0&sort=price_asc' \\
  -H 'accept: */*' \\
  -H 'accept-language: en-US,en;q=0.9' \\
  -b '_ga=GA1.1.356167732.1746290942; _ga_E3QPPBE8TS=GS2.1.s1749561621$o15$g1$t1749561868$j13$l0$h0; cf_clearance=X3qREDtSKVFWpdZ6frYU4MnpUQPMCCMU9jA6gZOEKNY-1749565452-1.2.1.1-oazpX4eS7c3ZtmaEv97RUannN7JTRwSJjnseZi5Kt05ZZYtmHvAB8lFZrldlf3kcZFZ43LxiySAwdLaMHJt_mcPs5S2venNMZUJxeHJGt7r.JxHXKB57.ANRlHXM.odPoUkspyvShl12UFA9vseVKsX8eaNlchg_uRNugP3kel4Tgg4KvTnfdTZcrzMnXH5CUJFgjeJ95LNBOp8b_0RYZ6lssOd7dxUs0Cenul7NbF.t0sv_NDitGVm7J9znJsDCW5L2f3Q3ornRhSaiaAYj2VFEzy8B278hPiPt6BAKRSnp470UImaAjrmmghuR7NfUEdX6z5e5ypZ.dSQWpSDKWEVL0TPHZjTw85Bkzlb2w2k' \\
  -H 'priority: u=1, i' \\
  -H 'referer: https://palacenft.com/collection/8' \\
  -H 'sec-ch-ua: "Microsoft Edge WebView2";v="137", "Microsoft Edge";v="137", "Not/A)Brand";v="24", "Chromium";v="137"' \\
  -H 'sec-ch-ua-mobile: ?0' \\
  -H 'sec-ch-ua-platform: "Windows"' \\
  -H 'sec-fetch-dest: empty' \\
  -H 'sec-fetch-mode: cors' \\
  -H 'sec-fetch-site: same-origin' \\
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36 Edg/137.0.0.0' \\`; // Corrected escaped characters

// Example Usage:
(async () => {
  try {
    console.log(Date.now().toString().slice(0, 10));

    const responseData = await curlToAxios(providedCurlCommand);
    console.log("Successfully fetched data:", responseData);
  } catch (error) {
    console.error("Failed to convert cURL and make API call:", error);
  }
})();
