function renderPomXml({ artifactId, groupId }) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/maven-v4_0_0.xsd">\n` +
    `  <modelVersion>4.0.0</modelVersion>\n` +
    `  <groupId>${groupId}</groupId>\n` +
    `  <artifactId>${artifactId}</artifactId>\n` +
    `  <version>1.0.0</version>\n` +
    `  <packaging>mule-application</packaging>\n` +
    `  <name>${artifactId}</name>\n` +
    `  <properties>\n` +
    `    <app.runtime>4.9.0-java17</app.runtime>\n` +
    `    <mule.version>4.9.0</mule.version>\n` +
    `    <mule.maven.plugin.version>4.7.0</mule.maven.plugin.version>\n` +
    `    <munit.version>3.0.0</munit.version>\n` +
    `  </properties>\n` +
    `  <build>\n` +
    `    <plugins>\n` +
    `      <plugin>\n` +
    `        <groupId>org.mule.tools.maven</groupId>\n` +
    `        <artifactId>mule-maven-plugin</artifactId>\n` +
    `        <version>\${mule.maven.plugin.version}</version>\n` +
    `        <extensions>true</extensions>\n` +
    `        <configuration>\n` +
    `          <cloudHubDeployment>\n` +
    `            <uri>https://anypoint.mulesoft.com</uri>\n` +
    `            <muleVersion>\${mule.version}</muleVersion>\n` +
    `            <connectedAppClientId>\${connectedAppClientId}</connectedAppClientId>\n` +
    `            <connectedAppClientSecret>\${connectedAppClientSecret}</connectedAppClientSecret>\n` +
    `            <connectedAppGrantType>client_credentials</connectedAppGrantType>\n` +
    `            <objectStoreV2>true</objectStoreV2>\n` +
    `            <properties>\n` +
    `              <env>\${env}</env>\n` +
    `              <anypoint.platform.client_id>\${anypoint.platform.client_id}</anypoint.platform.client_id>\n` +
    `              <anypoint.platform.client_secret>\${anypoint.platform.client_secret}</anypoint.platform.client_secret>\n` +
    `              <masterKey>\${masterKey}</masterKey>\n` +
    `            </properties>\n` +
    `          </cloudHubDeployment>\n` +
    `          <classifier>mule-application</classifier>\n` +
    `        </configuration>\n` +
    `      </plugin>\n` +
    `      <plugin>\n` +
    `        <groupId>com.mulesoft.munit.tools</groupId>\n` +
    `        <artifactId>munit-maven-plugin</artifactId>\n` +
    `        <version>\${munit.version}</version>\n` +
    `        <executions>\n` +
    `          <execution>\n` +
    `            <id>test</id>\n` +
    `            <phase>test</phase>\n` +
    `            <goals>\n` +
    `              <goal>test</goal>\n` +
    `              <goal>coverage-report</goal>\n` +
    `            </goals>\n` +
    `          </execution>\n` +
    `        </executions>\n` +
    `      </plugin>\n` +
    `    </plugins>\n` +
    `  </build>\n` +
    `  <dependencies>\n` +
    `    <dependency>\n` +
    `      <groupId>com.mulesoft.modules</groupId>\n` +
    `      <artifactId>mule-secure-configuration-property-module</artifactId>\n` +
    `      <version>1.3.0</version>\n` +
    `      <classifier>mule-plugin</classifier>\n` +
    `    </dependency>\n` +
    `    <dependency>\n` +
    `      <groupId>org.mule.modules</groupId>\n` +
    `      <artifactId>mule-apikit-module</artifactId>\n` +
    `      <version>1.11.7</version>\n` +
    `      <classifier>mule-plugin</classifier>\n` +
    `    </dependency>\n` +
    `    <dependency>\n` +
    `      <groupId>org.mule.connectors</groupId>\n` +
    `      <artifactId>mule-http-connector</artifactId>\n` +
    `      <version>1.10.6</version>\n` +
    `      <classifier>mule-plugin</classifier>\n` +
    `    </dependency>\n` +
    `    <dependency>\n` +
    `      <groupId>org.mule.modules</groupId>\n` +
    `      <artifactId>mule-validation-module</artifactId>\n` +
    `      <version>2.0.7</version>\n` +
    `      <classifier>mule-plugin</classifier>\n` +
    `    </dependency>\n` +
    `    <dependency>\n` +
    `      <groupId>com.mulesoft.munit</groupId>\n` +
    `      <artifactId>munit-tools</artifactId>\n` +
    `      <version>3.0.0</version>\n` +
    `      <classifier>mule-plugin</classifier>\n` +
    `      <scope>test</scope>\n` +
    `    </dependency>\n` +
    `    <dependency>\n` +
    `      <groupId>com.mulesoft.munit</groupId>\n` +
    `      <artifactId>munit-runner</artifactId>\n` +
    `      <version>3.0.0</version>\n` +
    `      <classifier>mule-plugin</classifier>\n` +
    `      <scope>test</scope>\n` +
    `    </dependency>\n` +
    `  </dependencies>\n` +
    `  <repositories>\n` +
    `    <repository>\n` +
    `      <id>mulesoft-releases</id>\n` +
    `      <name>MuleSoft Releases Repository</name>\n` +
    `      <url>https://repository.mulesoft.org/releases/</url>\n` +
    `      <layout>default</layout>\n` +
    `    </repository>\n` +
    `    <repository>\n` +
    `      <id>anypoint-exchange-v3</id>\n` +
    `      <name>Anypoint Exchange V3</name>\n` +
    `      <url>https://maven.anypoint.mulesoft.com/api/v3/maven</url>\n` +
    `      <layout>default</layout>\n` +
    `    </repository>\n` +
    `  </repositories>\n` +
    `</project>\n`
}

function renderMuleArtifactJson() {
  return `{\n  "minMuleVersion": "4.9.0",\n  "secureProperties": ["masterKey", "anypoint.platform.client_secret"]\n}\n`
}

function renderAppReadme({ repoName, workOrder, architecture }) {
  return `# ${repoName}\n\n` +
    `Generated by mulesoft-coding-agent from Jira ticket ${workOrder.sourceTicket || 'manual input'}.\n\n` +
    `## Summary\n\n` +
    `- Capability: ${workOrder.capability}\n` +
    `- API layer: ${architecture.apiLayer}\n` +
    `- Architecture decision: ${architecture.decision}\n` +
    `- Topology: ${architecture.topology}\n` +
    `- Mock mode: enabled by default in local properties\n\n` +
    `## Local Run\n\n` +
    `1. Keep \`app.mockMode=true\` in \`src/main/resources/properties/local.yaml\`\n` +
    `2. Open the project in Anypoint Code Builder and run locally\n` +
    `3. The generated bootstrap points to the local property set by default for a zero-setup first run\n` +
    `4. Switch mock mode off only after filling the secure-property placeholders and rewiring env promotion as needed\n`
}

function renderLog4j2() {
  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<Configuration status="WARN">\n` +
    `  <Appenders>\n` +
    `    <Console name="Console" target="SYSTEM_OUT">\n` +
    `      <PatternLayout pattern="%d %-5p [%t] %c - %m%n" />\n` +
    `    </Console>\n` +
    `  </Appenders>\n` +
    `  <Loggers>\n` +
    `    <Root level="INFO">\n` +
    `      <AppenderRef ref="Console" />\n` +
    `    </Root>\n` +
    `  </Loggers>\n` +
    `</Configuration>\n`
}

export function scaffoldMuleProject({ appDescriptor, workOrder, architecture }) {
  const groupId = 'com.newell.ecommerce'

  return {
    files: {
      'README.md': renderAppReadme({
        repoName: appDescriptor.repoName,
        workOrder,
        architecture
      }),
      'pom.xml': renderPomXml({ artifactId: appDescriptor.artifactId, groupId }),
      'mule-artifact.json': renderMuleArtifactJson(),
      'src/main/resources/log4j2.xml': renderLog4j2(),
      'src/test/resources/log4j2-test.xml': renderLog4j2()
    }
  }
}
