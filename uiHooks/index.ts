import { htm, withUiHook, HandlerOptions } from '@zeit/integration-utils'
import {
    deploymentConfig,
    deploymentStore,
    SCHEDULE_ENDPOINT,
    redisConfig,
} from '../lib/commons'

import { addEnvConfig } from './addBaseConfig'

export default withUiHook(
    async (handlerOptions: HandlerOptions): Promise<string> => {
        const { payload, zeitClient } = handlerOptions
        const { clientState, action, projectId, teamId } = payload

        if (!projectId) {
            return htm`
			<Page>
            <Box textAlign="right">
		    	<ProjectSwitcher />
            </Box>
            <Box padding="10px" textAlign="center">
                <P>Select a project to show scheduled deployment information:</P>
            </Box>
			</Page>
		`
        }

        if (!redisConfig) {
            return addEnvConfig(redisConfig, payload, zeitClient)
        }
        if (action === 'reset-all') {
            await zeitClient.setMetadata({})
            await fetch(`${SCHEDULE_ENDPOINT}/reset/${payload.projectId}`, {
                method: 'DELETE',
            })
        }

        const metadata: deploymentConfig = await zeitClient.getMetadata()
        if (action === 'submit') {
            const { ...deploymentStore } = clientState
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
                project_name: '',
                gitUrl: '',
                timeToDeploy: '',
                teamId: '',
            })
        }

        // TODO: Use datepicker for scheduling
        return htm`
		<Page>
        <H1>Enter scheduled deployment</H1>
        <Container>
            ${Object.keys(deploymentStore).map(k => {
                if (k !== 'name') {
                    htm`<Input label="projectName" name="project" value=${projectId} />`
                } else {
                    htm`<Input label="${k}" name="${k}" value=${
                        deploymentStore[k]
                    } />`
                }
            })}
        </Container>
        
        <Container>
            <Box display="flex" justifyContent="space-between">
                <H1>Scheduled Deployments</H1>
                ${Object.keys(metadata).forEach((k, indexNumber) => {
                    Object.keys(k).forEach(deploymentDetailKey => {
                        htm`
                            <P>${deploymentDetailKey}<P/>
                            <P>${metadata[indexNumber][deploymentDetailKey]}</P>
                            `
                    })
                })}
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
    }
)
