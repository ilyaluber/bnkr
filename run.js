const http = require(`http`);
const fs = require(`fs`);

const config = require(`./package.json`);
const {
  obj_host,
  obj_port,
  obj_methodHttp,
  obj_statusHttp,
  obj_headerNameHttp,
  obj_headerValueHttp,
  obj_typeof,
  obj_extension,
  obj_reqEvent,
  obj_route,
  obj_icon,
  obj_sign,
  obj_error,
  obj_messageShort,
  obj_messageLong,
} = require(`./store.js`);

const str_sqlVersion = require(`./external/database/sql/version.js`);

const fun_query = require(`./external/database/main/database.js`);

const fun_auth = require(`./job/auth.js`);
const fun_registerAgent = require(`./job/registerAgent`);

const fun_bfrToObj = require(`./service/bfrToObj.js`);

const fun_startListener = async () => {
  // message about starting server
  const str_messageStartExtended = obj_sign.str_empty.concat(
    obj_icon.str_iconServer,
    obj_sign.str_space,
    obj_messageLong.str_servStart,
    obj_sign.str_space,
    `[${ obj_host.str_hostServer }:${ obj_port.num_portServer }]`,
  );
  console.log(str_messageStartExtended);

  // adding hide parameters to global config
  const str_pathEnvFile = obj_sign.str_empty.concat(
    __dirname,
    obj_sign.str_slash,
    `${ obj_sign.str_dot }${ obj_extension.str_extEnv }`,
  );
  const bfr_envCustom = fs.readFileSync(str_pathEnvFile);
  const obj_envCustom = fun_bfrToObj(bfr_envCustom, false);
  Object.keys(obj_envCustom).map(key => {
    if (
      !process.env[key] ||
      process.env[key] !== obj_envCustom[key]
    ) {
      process.env[key] = obj_envCustom[key];
    }
  });

  // connection to database
  const arr_resDb = await fun_query(
    false,
    str_sqlVersion,
    [],
  );
  const str_versionDb = arr_resDb[0]?.version;
  if (
    str_versionDb &&
    typeof str_versionDb === obj_typeof.str_typeStr &&
    str_versionDb.length
  ) {
    const str_versionDbShort = `${ str_versionDb.slice(0, 16) }${ obj_sign.str_mdot }`;
    const str_messageDbConnectedExtended = obj_sign.str_empty.concat(
      obj_icon.str_iconDb,
      obj_sign.str_space,
      obj_messageLong.str_dbConnect,
      obj_sign.str_space,
      `[${ process.env.PGDATABASE }]`,
      obj_sign.str_space,
      `[${ process.env.PGHOST }:${ process.env.PGPORT }]`,
      obj_sign.str_space,
      `[${ str_versionDbShort }]`,
    );
    console.log(str_messageDbConnectedExtended);
  } else {
    const str_errorLocal = obj_sign.str_empty.concat(
      obj_icon.str_iconError,
      obj_sign.str_space,
      obj_messageLong.str_dbNoConnect,
    )
    console.error(str_errorLocal);
  }

  // server was successfully started
  console.log(obj_sign.str_newline);
}

const server = http.createServer(async (incomingMessage, serverResponse) => {
  // message about catching request
  const str_logRequestStart = obj_sign.str_empty.concat(
    obj_icon.str_iconRequest,
    obj_sign.str_space,
    `[${ incomingMessage.method }]`,
    obj_sign.str_space,
    `[${ incomingMessage.url }]`,
  );

  console.log(str_logRequestStart);

  // catching request body from stream
  let str_rawData = obj_sign.str_empty;
  let obj_reqBody = null;

  incomingMessage.on(obj_reqEvent.str_eventData, (chunk) => {
    str_rawData += chunk;
  });

  incomingMessage.on(obj_reqEvent.str_eventEnd, async () => {
    // parsing request body to json
    try {
      if (str_rawData) {
        const any_parsedData = JSON.parse(str_rawData);
        if (
          any_parsedData &&
          typeof any_parsedData === obj_typeof.str_typeObj
        ) {
          obj_reqBody = any_parsedData;
        }
      }
    } catch (error) {
      const str_error = (
        error?.message ||
        error?.toString() ||
        obj_sign.str_empty
      );

      console.log(`${ obj_error.str_reqbody } [${ str_error }]`);
    }
  
    // check of request authorization
    const str_headerNameAuth = obj_headerNameHttp.str_headerAuthorization.toLowerCase();
    const any_sessionInitial = incomingMessage.headers[str_headerNameAuth];
    const obj_agent = await fun_auth(any_sessionInitial, false);
    const bol_authorized = !!(obj_agent && obj_agent.id);
    
    // handling request by method and route
    switch (incomingMessage.method) {
      // GET
      case obj_methodHttp.str_methodGet:
        switch (incomingMessage.url) {
          case obj_route.str_routePing:
            serverResponse.setHeader(
              obj_headerNameHttp.str_headerContentType,
              obj_headerValueHttp.str_headerValueText,
            );
            serverResponse.statusCode = obj_statusHttp.num_statusOk;
            serverResponse.end(obj_messageShort.str_pong);
          break;
  
          case obj_route.str_routeInfoApp:
            if (bol_authorized) {
              serverResponse.setHeader(
                obj_headerNameHttp.str_headerContentType,
                obj_headerValueHttp.str_headerValueText,
              );
              serverResponse.statusCode = obj_statusHttp.num_statusOk;
              const str_infoApp = obj_sign.str_empty.concat(
                config.name,
                obj_sign.str_space,
                config.version,
                obj_sign.str_space,
                config.description,
              );
              serverResponse.end(str_infoApp);
            } else {
              serverResponse.setHeader(
                obj_headerNameHttp.str_headerContentType,
                obj_headerValueHttp.str_headerValueText,
              );
              serverResponse.statusCode = obj_statusHttp.num_statusUnauthorized;
              serverResponse.end(obj_messageShort.str_unauthorized);
            }
          break;
        
          default:
            serverResponse.setHeader(
              obj_headerNameHttp.str_headerContentType,
              obj_headerValueHttp.str_headerValueText,
            );
            serverResponse.statusCode = obj_statusHttp.num_statusNotFound;
            serverResponse.end(obj_messageShort.str_notFound);
          break;
        }
      break;
  
      // POST
      case obj_methodHttp.str_methodPost:
        switch (incomingMessage.url) {
          case obj_route.str_routeRegAgent:
            if (bol_authorized) {
              serverResponse.setHeader(
                obj_headerNameHttp.str_headerContentType,
                obj_headerValueHttp.str_headerValueText,
              );
              serverResponse.statusCode = obj_statusHttp.num_statusWrongAuthorized;
              serverResponse.end(obj_messageShort.str_needNoAuth);
            } else {
              //TODO end registration
              const obj_agentCreationResult = await fun_registerAgent(
                false,
                obj_reqBody?.secret,
                obj_reqBody?.code,
                obj_reqBody?.login,
                obj_reqBody?.password,
                obj_reqBody?.alias,
              );
  
              if (obj_agentCreationResult.error) {
                serverResponse.setHeader(
                  obj_headerNameHttp.str_headerContentType,
                  obj_headerValueHttp.str_headerValueText,
                );
                serverResponse.statusCode = obj_statusHttp.num_serverError;
                serverResponse.end(obj_agentCreationResult.error);
              } else {
                serverResponse.setHeader(
                  obj_headerNameHttp.str_headerContentType,
                  obj_headerValueHttp.str_headerValueText,
                );
                serverResponse.statusCode = obj_statusHttp.num_statusOk;
                serverResponse.end(obj_agentCreationResult.message);                
              }
            }
          break;
  
          default:
            serverResponse.setHeader(
              obj_headerNameHttp.str_headerContentType,
              obj_headerValueHttp.str_headerValueText,
            );
            serverResponse.statusCode = obj_statusHttp.num_statusNotFound;
            serverResponse.end(obj_messageShort.str_notFound);
          break;
        }
      break;
  
      // ANY OTHER
      default:
        serverResponse.setHeader(
          obj_headerNameHttp.str_headerContentType,
          obj_headerValueHttp.str_headerValueText
        );
        serverResponse.statusCode = obj_statusHttp.num_statusMethodNotAllowed;
        serverResponse.end(obj_messageShort.str_methodNotAllowed);
      break;
    }
  });

});

server.listen(
  obj_port.num_portServer,
  obj_host.str_hostServer,
  fun_startListener,
);