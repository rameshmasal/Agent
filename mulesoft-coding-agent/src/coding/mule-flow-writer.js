import { buildApikitFlowName, escapeXml, operationSlug } from './utils.js'

function buildRequestConfigs(downstreamSystems = []) {
  return downstreamSystems
    .map((system) => {
      const key = operationSlug({ method: 'CONFIG', path: system })
      const prefix = key.replace(/^config-/, '')
      return {
        key,
        prefix,
        configName: `${prefix}-request-config`
      }
    })
}

function renderGlobalConfig({ appDescriptor, workOrder, architecture }) {
  const appKey = appDescriptor.artifactId
  const routerConfigName = `${appDescriptor.artifactId}-router-config`
  const requestConfigs = buildRequestConfigs(workOrder.downstreamSystems)

  const requestConfigXml = requestConfigs
    .map(
      ({ prefix, configName }) =>
        `  <http:request-config name="${configName}" doc:name="HTTP Request configuration">\n` +
        `    <http:request-connection protocol="\${${prefix}.protocol}" host="\${${prefix}.host}" port="\${${prefix}.port}" />\n` +
        `  </http:request-config>`
    )
    .join('\n')

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<mule xmlns:secure-properties="http://www.mulesoft.org/schema/mule/secure-properties"\n` +
    `  xmlns:api-gateway="http://www.mulesoft.org/schema/mule/api-gateway"\n` +
    `  xmlns:apikit="http://www.mulesoft.org/schema/mule/mule-apikit"\n` +
    `  xmlns:http="http://www.mulesoft.org/schema/mule/http"\n` +
    `  xmlns="http://www.mulesoft.org/schema/mule/core"\n` +
    `  xmlns:doc="http://www.mulesoft.org/schema/mule/documentation"\n` +
    `  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n` +
    `  xsi:schemaLocation="\n` +
    `http://www.mulesoft.org/schema/mule/mule-apikit http://www.mulesoft.org/schema/mule/mule-apikit/current/mule-apikit.xsd\n` +
    `http://www.mulesoft.org/schema/mule/http http://www.mulesoft.org/schema/mule/http/current/mule-http.xsd\n` +
    `http://www.mulesoft.org/schema/mule/core http://www.mulesoft.org/schema/mule/core/current/mule.xsd\n` +
    `http://www.mulesoft.org/schema/mule/api-gateway http://www.mulesoft.org/schema/mule/api-gateway/current/mule-api-gateway.xsd\n` +
    `http://www.mulesoft.org/schema/mule/secure-properties http://www.mulesoft.org/schema/mule/secure-properties/current/mule-secure-properties.xsd">\n` +
    `  <global-property name="env" value="local" />\n` +
    `  <global-property name="masterKey" value="local-dev-master-key" />\n` +
    `  <configuration-properties file="properties/\${env}.yaml" />\n` +
    `  <secure-properties:config name="Secure_Properties_Config" file="properties/local-secure.yaml" key="\${masterKey}">\n` +
    `    <secure-properties:encrypt algorithm="Blowfish" />\n` +
    `  </secure-properties:config>\n` +
    `  <http:listener-config name="${appDescriptor.artifactId}-listener-config">\n` +
    `    <http:listener-connection host="0.0.0.0" port="\${${appKey}.http-listener.port}" />\n` +
    `  </http:listener-config>\n` +
    `  <apikit:config name="${routerConfigName}" api="${appDescriptor.ramlFileName}" outboundHeadersMapName="outboundHeaders" httpStatusVarName="httpStatus" />\n` +
    `${requestConfigXml ? `${requestConfigXml}\n` : ''}` +
    `  <api-gateway:autodiscovery apiId="\${${appKey}.api-discovery.id}" flowRef="${appDescriptor.artifactId}-main" />\n` +
    `</mule>\n`
  )
}

function renderGlobalErrorHandler() {
  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<mule xmlns:ee="http://www.mulesoft.org/schema/mule/ee/core"\n` +
    `  xmlns="http://www.mulesoft.org/schema/mule/core"\n` +
    `  xmlns:doc="http://www.mulesoft.org/schema/mule/documentation"\n` +
    `  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n` +
    `  xsi:schemaLocation="\n` +
    `http://www.mulesoft.org/schema/mule/core http://www.mulesoft.org/schema/mule/core/current/mule.xsd\n` +
    `http://www.mulesoft.org/schema/mule/ee/core http://www.mulesoft.org/schema/mule/ee/core/current/mule-ee.xsd">\n` +
    `  <error-handler name="global-error">\n` +
    `    <on-error-propagate logException="true" type="ANY">\n` +
    `      <ee:transform>\n` +
    `        <ee:message>\n` +
    `          <ee:set-payload><![CDATA[%dw 2.0\noutput application/json\n---\n{\n  success: false,\n  message: (error.description default error.errorType.identifier default \"Unhandled Mule error\"),\n  correlationId: correlationId()\n}]]></ee:set-payload>\n` +
    `        </ee:message>\n` +
    `        <ee:variables>\n` +
    `          <ee:set-variable variableName="httpStatus">500</ee:set-variable>\n` +
    `        </ee:variables>\n` +
    `      </ee:transform>\n` +
    `    </on-error-propagate>\n` +
    `  </error-handler>\n` +
    `</mule>\n`
  )
}

function renderRouterFile({ appDescriptor, operations }) {
  const routerConfigName = `${appDescriptor.artifactId}-router-config`
  const flowRefs = operations
    .map((operation) => {
      const flowName = buildApikitFlowName(operation, routerConfigName)
      const reusableFlowName = `rf-${operationSlug(operation)}`
      return (
        `  <flow name="${flowName}">\n` +
        `    <flow-ref name="${reusableFlowName}" />\n` +
        `  </flow>\n`
      )
    })
    .join('')

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<mule xmlns:apikit="http://www.mulesoft.org/schema/mule/mule-apikit"\n` +
    `  xmlns:http="http://www.mulesoft.org/schema/mule/http"\n` +
    `  xmlns="http://www.mulesoft.org/schema/mule/core"\n` +
    `  xmlns:doc="http://www.mulesoft.org/schema/mule/documentation"\n` +
    `  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n` +
    `  xsi:schemaLocation="\n` +
    `http://www.mulesoft.org/schema/mule/core http://www.mulesoft.org/schema/mule/core/current/mule.xsd\n` +
    `http://www.mulesoft.org/schema/mule/http http://www.mulesoft.org/schema/mule/http/current/mule-http.xsd\n` +
    `http://www.mulesoft.org/schema/mule/mule-apikit http://www.mulesoft.org/schema/mule/mule-apikit/current/mule-apikit.xsd">\n` +
    `  <flow name="${appDescriptor.artifactId}-main">\n` +
    `    <http:listener config-ref="${appDescriptor.artifactId}-listener-config" path="\${${appDescriptor.artifactId}.http-listener.path}" doc:name="Listener">\n` +
    `      <http:response statusCode="#[vars.httpStatus default 200]" />\n` +
    `      <http:error-response statusCode="#[vars.httpStatus default 500]">\n` +
    `        <http:body><![CDATA[#[payload]]]></http:body>\n` +
    `      </http:error-response>\n` +
    `    </http:listener>\n` +
    `    <apikit:router config-ref="${routerConfigName}" />\n` +
    `    <error-handler ref="global-error" />\n` +
    `  </flow>\n` +
    `  <flow name="${appDescriptor.artifactId}-console">\n` +
    `    <http:listener config-ref="${appDescriptor.artifactId}-listener-config" path="\${${appDescriptor.artifactId}.http-listener.console}" />\n` +
    `    <apikit:console config-ref="${routerConfigName}" />\n` +
    `  </flow>\n` +
    `${flowRefs}` +
    `</mule>\n`
  )
}

function buildOtherwiseBlock({ operation, architecture, downstreamConfigName }) {
  const method = String(operation.method || 'GET').toUpperCase()
  const contentType = operation.requestBody?.contentType || 'application/json'
  const requestBodyTransform = operation.requestBody
    ? `    <ee:transform doc:name="Build outbound request">\n` +
      `      <ee:message>\n` +
      `        <ee:set-payload resource="transformdata/${operationSlug(operation)}-request.dwl" />\n` +
      `      </ee:message>\n` +
      `    </ee:transform>\n`
    : ''

  const queryParamsBlock =
    operation.queryParameters && operation.queryParameters.length > 0
      ? `      <http:query-params><![CDATA[#[attributes.queryParams default {}]]]></http:query-params>\n`
      : ''

  const bodyBlock =
    operation.requestBody
      ? `      <http:body><![CDATA[#[payload]]]></http:body>\n`
      : ''

  const authFlowRef =
    architecture.apiLayer === 'system'
      ? `    <flow-ref name="sf-${operationSlug(operation)}-auth-hook" />\n`
      : ''

  return (
    `${authFlowRef}` +
    `${requestBodyTransform}` +
    `    <http:request method="${method}" config-ref="${downstreamConfigName}" path="${escapeXml(operation.path)}">\n` +
    `      <http:headers><![CDATA[#[vars.outboundHeaders default { "Content-Type": "${contentType}" }]]]></http:headers>\n` +
    `${queryParamsBlock}` +
    `${bodyBlock}` +
    `    </http:request>\n`
  )
}

function renderReusableFlows({ appDescriptor, workOrder, architecture, operations }) {
  const downstreamConfigName =
    buildRequestConfigs(workOrder.downstreamSystems)[0]?.configName || 'downstream-request-config'

  const flowXml = operations
    .map((operation) => {
      const slug = operationSlug(operation)
      return (
        `  <flow name="rf-${slug}">\n` +
        `    <choice>\n` +
        `      <when expression="#[(p('app.mockMode') default 'true') == 'true']">\n` +
        `        <ee:transform doc:name="Return mock response">\n` +
        `          <ee:message>\n` +
        `            <ee:set-payload resource="transformdata/${slug}-mock-response.dwl" />\n` +
        `          </ee:message>\n` +
        `        </ee:transform>\n` +
        `      </when>\n` +
        `      <otherwise>\n` +
        `${buildOtherwiseBlock({ operation, architecture, downstreamConfigName })}` +
        `      </otherwise>\n` +
        `    </choice>\n` +
        `  </flow>\n` +
        (architecture.apiLayer === 'system'
          ? `  <sub-flow name="sf-${slug}-auth-hook">\n` +
            `    <set-variable variableName="outboundHeaders" value='#[{\n` +
            `      "Authorization": "Bearer " ++ (p("secure::backend.accessToken") default "replace-me"),\n` +
            `      "Content-Type": "${operation.requestBody?.contentType || 'application/json'}"\n` +
            `    }]' />\n` +
            `  </sub-flow>\n`
          : '')
      )
    })
    .join('\n')

  return (
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<mule xmlns:ee="http://www.mulesoft.org/schema/mule/ee/core"\n` +
    `  xmlns:http="http://www.mulesoft.org/schema/mule/http"\n` +
    `  xmlns="http://www.mulesoft.org/schema/mule/core"\n` +
    `  xmlns:doc="http://www.mulesoft.org/schema/mule/documentation"\n` +
    `  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n` +
    `  xsi:schemaLocation="\n` +
    `http://www.mulesoft.org/schema/mule/core http://www.mulesoft.org/schema/mule/core/current/mule.xsd\n` +
    `http://www.mulesoft.org/schema/mule/http http://www.mulesoft.org/schema/mule/http/current/mule-http.xsd\n` +
    `http://www.mulesoft.org/schema/mule/ee/core http://www.mulesoft.org/schema/mule/ee/core/current/mule-ee.xsd">\n` +
    `${flowXml}` +
    `</mule>\n`
  )
}

export function writeMuleFlows({ appDescriptor, workOrder, architecture }) {
  return {
    files: {
      'src/main/mule/cf-global.xml': renderGlobalConfig({ appDescriptor, workOrder }),
      'src/main/mule/pf-global-error-handler.xml': renderGlobalErrorHandler(),
      'src/main/mule/pf-router.xml': renderRouterFile({
        appDescriptor,
        operations: workOrder.operations
      }),
      [`src/main/mule/rf-${appDescriptor.capabilitySlug}.xml`]: renderReusableFlows({
        appDescriptor,
        workOrder,
        architecture,
        operations: workOrder.operations
      })
    }
  }
}
