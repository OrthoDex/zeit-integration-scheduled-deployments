import { htm } from '@zeit/integration-utils'
import * as pick from 'lodash.pick'

export const addEnvConfig = async ({ config, payload, zeitClient }) => {
    const {
        action,
        clientState,
        projectId,
        integrationId,
        configurationId,
        slug,
        teamId,
        token,
    } = payload
    if (action === 'add-env') {
        await Object.keys(config).forEach(async key => {
            const secretName = await zeitClient.ensureSecret(
                key,
                pick(clientState, key)
            )
            await zeitClient.upsertEnv(projectId, key.toUpperCase, secretName)
        })

        const secretName = await zeitClient.ensureSecret(
            'metaData',
            JSON.stringify({
                integrationId,
                configurationId,
                slug,
                teamId,
                token,
            })
        )
        await zeitClient.upsertEnv(projectId, 'USER_METADATA', secretName)

        return `
          <Page>
            Environment variables added.
            <Button small action="view">Go Back</Button>
          </Page>
        `
    }

    return htm`
    <Page>
      <Container>
        ${Object.keys(config).map(k => {
            htm`<Input label="${k}" name="${k}" value=${config[k]} />`
        })}
			</Container>
      <Button action="add-env">Add Env</Button>
    </Page>
    `
}
