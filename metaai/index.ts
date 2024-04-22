import axios, { type AxiosInstance } from 'axios';
import { v4 as uuidv4 } from 'uuid';
import Sources from './interfaces/Sources';

/**
 * A class for interacting with the Meta AI API.
 */
class MetaAI {
  /** The Axios instance for making requests. */
  session: AxiosInstance;
  /** The access token for making authenticated requests. */
  access_token: string = '';
  /** The cookies for making requests. */
  cookies: string = '';
  /** The LSD token for making requests. */
  lsd: string = '';
  /** The conversation ID for making requests. */
  conversation_id: string = '';
  /** The last fetch ID for making requests. */
  last_fetch_id: string = '';
  constructor() {
    this.session = axios.create({});
    this.conversation_id = uuidv4();
  }

  /**
   * Generates a unique threading ID.
   *
   * The function generates a random string of 19 characters, composed only of digits (0-9).
   * The first character of the string will never be '0' or '9'.
   * @returns {string} A unique threading ID.
   */
  threadingID() {
    while (true) {
      const characters = '1234567890';

      let result = '';

      for (let i = 0; i < 19; i++) {
        result += characters.charAt(
          Math.floor(Math.random() * characters.length)
        );
      }

      if (result.charAt(0) == '9' || result.charAt(0) == '0') {
        continue;
      }

      return result;
    }
  }

  /**
   * Initializes the session by fetching the Meta AI homepage and extracting necessary cookies and tokens.
   *
   * This function sends a GET request to the Meta AI homepage with a set of predefined headers.
   * If the status is not 200, it returns false.
   * Otherwise, it extracts the abra_csrf, _js_datr, datr, and lsd tokens from the response data and sets them as cookies.
   * It also stores the lsd token in the this.lsd property.
   *
   * @returns {Promise<boolean>}
   */
  async init(): Promise<boolean> {
    const headers = {
      'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'accept-language': 'en-US,en;q=0.9',
      accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'sec-fetch-mode': 'navigate',
    };

    const response = await this.session.get('https://meta.ai/', { headers });

    if (response.status != 200) {
      return false;
    }

    const abra_csrf = response.data.match(/abra_csrf":{"value":"(.*?)"/)[1];
    const _js_datr = response.data.match(/_js_datr":{"value":"(.*?)"/)[1];
    const datr = response.data.match(/datr":{"value":"(.*?)"/)[1];
    const lsd = response.data.match(/LSD.*?token":"(.*?)"/)[1];

    this.cookies = `_js_datr=${_js_datr}; abra_csrf=${abra_csrf}; datr=${datr}; lsd=${lsd}`;

    this.lsd = lsd;

    return true;
  }

  /**
   * Sets the access token by sending a GraphQL request to the Meta AI API.
   *
   * This function sends a POST request to the Meta AI GraphQL endpoint with a predefined body and headers.
   * The body contain the lsd token, some variables, and a document ID.
   * If the response status is not 200, it returns false without setting the access token.
   * Otherwise, it extracts the access token from the response data and stores it in the this.access_token property.
   *
   * @returns
   */
  async set_access_token(): Promise<boolean> {
    const body = {
      lsd: this.lsd,
      variables:
        '{"dob":"1997-01-01","icebreaker_type":"TEXT","__relay_internal__pv__WebPixelRatiorelayprovider":1}',
      server_timestamps: 'true',
      doc_id: '7604648749596940',
    };

    const encoded_body = new URLSearchParams(body).toString();

    const headers = {
      'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'x-fb-friendly-name': 'useAbraAcceptTOSForTempUserMutation',
      'x-fb-lsd': this.lsd,
      accept: '*/*',
      origin: 'https://www.meta.ai',
      'sec-fetch-site': 'same-origin',
      'sec-fetch-mode': 'cors',
      'sec-fetch-dest': 'empty',
      referer: 'https://www.meta.ai/',
      'accept-language': 'en-US,en;q=0.9',
      priority: 'u=1, i',
      'content-type': 'application/x-www-form-urlencoded',
      cookie: this.cookies,
    };

    const response = await this.session.post(
      'https://www.meta.ai/api/graphql/',
      encoded_body,
      { headers }
    );

    if (response.status != 200) {
      return false;
    }

    this.access_token =
      response.data['data']['xab_abra_accept_terms_of_service'][
        'new_temp_user_auth'
      ]['access_token'];

    return true;
  }

  /**
   * Sends a prompt to the Meta AI chatbot and returns the response.
   *
   * This function first checks, if the cookies and access token are set. If not, it initializes and sets them.
   * Then it sends a POST request to the Meta AI GraphQL endpoint with a predefined body and headers.
   * The body contains the prompt message, conversation ID, threading ID, and other parameters.
   * If the rseponse status is not 200, it returns false.
   * The response is then parsed to extract the chatbot's response.
   *
   * @param {string} message The prompt message to send to the chatbot
   * @returns {Promise<boolean | string>}
   */
  async prompt(message: string): Promise<boolean | string> {
    if (this.cookies == '') {
      if (!(await this.init())) {
        return false;
      }
    }
    if (this.access_token == '') {
      if (!(await this.set_access_token())) {
        return false;
      }
    }
    const headers = {
      cookie: this.cookies,
      accept: '*/*',
      referer: 'https://www.meta.ai/',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      origin: 'https://www.meta.ai',
      priority: 'u=1, i',
      'x-fb-friendly-name': 'useAbraSendMessageMutation',
    };

    const body = {
      access_token: this.access_token,
      dpr: '1',
      lsd: this.lsd,
      jazoest: '2925',
      fb_api_caller_class: 'useAbraSendMessageMutation',
      server_timestamps: 'true',
      doc_id: '7783822248314888',
      variables: `{"message":{"sensitive_string_value":"${message}"},"externalConversationId":"${
        this.conversation_id
      }","offlineThreadingId":"${this.threadingID()}","suggestedPromptIndex":null,"flashVideoRecapInput":{"images":[]},"flashPreviewInput":null,"promptPrefix":null,"entrypoint":"ABRA__CHAT__TEXT","icebreaker_type":"TEXT","__relay_internal__pv__AbraDebugDevOnlyrelayprovider":false,"__relay_internal__pv__WebPixelRatiorelayprovider":1}`,
    };
    const encoded_body = new URLSearchParams(body).toString();

    const response = await this.session.post(
      'https://graph.meta.ai/graphql?locale=user',
      encoded_body,
      { headers }
    );

    if (response.status != 200) {
      return false;
    }

    const response_arr = response.data.split('\n');

    let llm_done = '';

    for (let i = 0; i < response_arr.length; i++) {
      if (response_arr[i].includes('OVERALL_DONE')) {
        llm_done = response_arr[i];
      }
    }

    const json_resp = JSON.parse(llm_done);

    const llm_response =
      json_resp['data']['node']['bot_response_message']['snippet'];

    this.last_fetch_id =
      json_resp['data']['node']['bot_response_message']['fetch_id'];

    return llm_response;
  }

  /**
   * Retrieves the sources for a given fetch ID
   *
   * This function sends a POST request to the Meta AI GraphQL endpoint with a predefined bddy and headers.
   * The body contains the fetch ID, access token, and other parameters.
   * If the rseponse status is not 200, it returns false.
   * The response is then parsed ot extract the search results and references.
   *
   * @param {string} [fetch_id] The fetch ID to retrieve sources for. If not provided, it defaults to the last fetch ID.
   * @returns {Promise<Sources | false>}
   */
  async sources(fetch_id?: string): Promise<Sources | false> {
    if (typeof fetch_id == 'undefined') {
      fetch_id = this.last_fetch_id;
    }

    const headers = {
      cookie: this.cookies,
      accept: '*/*',
      referer: 'https://www.meta.ai/',
      'accept-language': 'en-US,en;q=0.9',
      'content-type': 'application/x-www-form-urlencoded',
      'user-agent':
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      origin: 'https://www.meta.ai',
      priority: 'u=1, i',
      'x-fb-friendly-name': 'AbraSearchPluginDialogQuery',
    };

    const body: Record<string, string> = {
      access_token: this.access_token,
      av: '0',
      lsd: this.lsd,
      dpr: '1',
      fbi_api_caller_class: 'RelayModern',
      fbi_api_req_friendly_name: 'AbraSearchPluginDialogQuery',
      server_timestamps: 'true',
      doc_id: '6946734308765963',
      variables: `{"abraMessageFetchID":"${fetch_id}"}`,
    };

    const encoded_body = new URLSearchParams(body).toString();

    const response = await this.session.post(
      'https://graph.meta.ai/graphql?locale=user',
      encoded_body,
      { headers }
    );

    if (response.status != 200) {
      return false;
    }

    const searchResults = response.data['data']['message']['searchResults'];

    const sources: Sources = {
      search_engine: searchResults['search_engine'],
      search_query: searchResults['search_query'],
      references: [],
    };

    for (const reference of searchResults['references']) {
      sources.references.push({
        link: reference['link'],
        title: reference['title'],
      });
    }

    return sources;
  }
}

export default MetaAI;
