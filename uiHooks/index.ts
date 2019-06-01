import { withUiHook, htm } from '@zeit/integration-utils'
import {
    deploymentConfig,
    deploymentStore,
    SCHEDULE_ENDPOINT,
    redisConfig,
} from '../lib/commons'

const Info = require('./info')
const addRedisConfig = require('./addRedisConfig')

module.exports = withUiHook(async ({ payload, zeitClient }) => {
    const { clientState, action, projectId } = payload
    if (!projectId) {
        return htm`
			<Page>
				<${Info}>Select a project to show scheduled deployment information: <ProjectSwitcher/><//>
			</Page>
		`
    }

    if (!redisConfig) {
        return addRedisConfig({ redisConfig })
    }
    if (action === 'reset-all') {
        await zeitClient.setMetadata({})
        await fetch(`${SCHEDULE_ENDPOINT}/reset/${payload.projectId}`, {
            method: 'DELETE',
        })
    }

    const metadata: deploymentConfig = await zeitClient.getMetadata()

    if (action === 'submit') {
        const { deploymentStore } = clientState
        metadata.deploymentStores.push(deploymentStore)
        // Set metadata
        await zeitClient.setMetadata(metadata)
        await fetch(SCHEDULE_ENDPOINT, {
            method: 'POST',
            body: JSON.stringify(deploymentStore),
        })
    }

    if (action === 'reset') {
        Object.assign(deploymentStore, {
            project: {
                name: '',
                gitUrl: '',
                timeToDeploy: '',
            },
        })
    }

    return htm`
		<Page>
        <H1>Enter scheduled deployment</H1>
        <Container>
            ${Object.keys(deploymentStore.project).map(k => {
                if (k !== 'name') {
                    htm`<Input label="projectName" name="project" value=${projectId} />`
                } else {
                    htm`<Input label="${k}" name="${k}" value=${
                        deploymentStore.project[k]
                    } />`
                }
            })}
        </Container>
        
        <Container>
            <Box display="flex" justifyContent="space-between">
                <H1>Scheduled Deployments</H1>
                ${Object.keys(metadata).forEach(
                    (k: deploymentStore, indexNumber) => {
                        Object.keys(k.project).forEach(deploymentDetailKey => {
                            htm`
                            <P>${deploymentDetailKey}<P/>
                            <P>${
                                metadata[indexNumber].project[
                                    deploymentDetailKey
                                ]
                            }</P>
                            `
                        })
                    }
                )}
            </Box>
        </Container>
        <Container>
            <Button action="submit">Submit</Button>
            <Button action="reset">Reset</Button>
            <Button action="reset-all">Reset All</Button>
        </Container>
        <AutoRefresh timeout=${3000} />
		</Page>
	`
})
