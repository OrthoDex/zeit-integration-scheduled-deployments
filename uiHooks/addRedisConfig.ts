import { htm } from '@zeit/integration-utils'

module.exports = async ({ redisConfig }) => htm`
    <Page>
      <Container>
        ${Object.keys(redisConfig).map(k => {
            htm`<Input label="${k}" name="${k}" value=${redisConfig[k]} />`
        })}
			</Container>
      <Button action="add-env">Add Env</Button>
    </Page>
    `
