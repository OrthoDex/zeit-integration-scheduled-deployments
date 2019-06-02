import { htm, withUiHook, HandlerOptions } from '@zeit/integration-utils'
import {
    deploymentConfig,
    SCHEDULE_ENDPOINT,
    redisConfig,
    deploymentDetails,
} from '../lib/commons'

import { addEnvConfig } from './addBaseConfig'
import * as pick from 'lodash.pick'
import * as isEmpty from 'lodash.isempty'
const fetch = require('@zeit/fetch')(require('node-fetch'))
import { logger } from '../lib/logging'

const deploymentDetailsCache: deploymentDetails = {
    projectId: '',
    rawFileUrl: '',
    timeToDeploy: '',
    teamId: '',
    userId: '',
}

const showScheduledDeployments = ({ metadata, children }) => htm`
    ${
        isEmpty(metadata) || isEmpty(metadata.deploymentStores)
            ? htm`<P> There are no scheduled deployments</P>`
            : metadata.deploymentStores.forEach(
                  (deploymentDetail: deploymentDetails) => {
                      Object.keys(deploymentDetails).map(
                          key => htm`
                        <P>${key}</P>
                        <P>${deploymentDetail[key]}</P>
                      `
                      )
                  }
              )
    }`

const createDeploymentForm = ({ children }) => htm`
    <Box marginTop="10px">
    ${Object.keys(deploymentDetailsCache).map(
        k => htm`${
            !['teamId', 'userId'].includes(k)
                ? htm`<Input label="${k}" name="${k}" value="${
                      deploymentDetailsCache[k]
                  }" />`
                : htm`<P></P>`
        }
		
			`
    )}
    </Box>
`

const projectSwitcher = ({ children, projectId }) => htm`
			<Page>
            <Box textAlign="right">
		    	<ProjectSwitcher />
            </Box>
            ${
                isEmpty(projectId)
                    ? htm`
            <Box padding="10px" textAlign="center">
                <P>Select a project to show scheduled deployment information:</P>
            </Box>
            `
                    : htm`<P></P>`
            }
            </Page>
		`

export default withUiHook(
    async (handlerOptions: HandlerOptions): Promise<string> => {
        const { payload, zeitClient } = handlerOptions
        const { clientState, action, projectId, teamId, user } = payload
        const uid = user.id
        let status = 'pending'

        if (!projectId) {
            return htm`<${projectSwitcher} //>`
        }

        deploymentDetailsCache.projectId = projectId
        deploymentDetailsCache.teamId = teamId || ''

        // TODO: Add ability to define user's own redis cluster
        // if (!redisConfig) {
        //     return addEnvConfig(redisConfig, payload, zeitClient)
        // }

        if (action === 'reset-all') {
            await zeitClient.setMetadata({})
            await fetch(
                `${SCHEDULE_ENDPOINT}/api/reset/${payload.projectId}/${uid}`,
                {
                    method: 'DELETE',
                }
            )
        }

        let metadata: deploymentConfig = await zeitClient.getMetadata()
        if (action === 'submit') {
            const deploymentDetails = pick(
                clientState,
                Object.keys(deploymentDetailsCache)
            )
            if (isEmpty(metadata)) {
                metadata = {
                    deploymentStores: [],
                }
            }

            deploymentDetails.userId = uid

            logger.debug('deployment', { deploymentDetails })

            // Set metadata
            await zeitClient.setMetadata(metadata)
            const res = await fetch(`${SCHEDULE_ENDPOINT}/api/register`, {
                method: 'POST',
                body: JSON.stringify({
                    deploymentDetails: deploymentDetails,
                }),
            })

            logger.debug('status', { res })

            if (res.status === 204) {
                metadata.deploymentStores.push(deploymentDetails)
                status = 'success'
            } else {
                status = 'error'
            }
        }

        if (action === 'reset') {
            Object.assign(deploymentDetailsCache, {
                projectId: '',
                rawFileUrl: '',
                timeToDeploy: '',
                teamId: '',
            })
        }

        // TODO: Use datepicker for scheduling
        return htm`
            <Page>
            <Container>
                <Notice type="${
                    status === 'pending' ? 'message' : status
                }">Deployment Status: ${status}</Notice>
            </Container>
            <Container>
                <H1>Switch projects</H1>
                ${htm`<${projectSwitcher} projectId=${projectId} //>`}
            </Container>
            <Container>
                <Box>
                    <H1>Enter scheduled deployment</H1>
                    ${htm`<${createDeploymentForm} //>`}
                </Box>
            </Container>
            <Container>
                <Box>
                    <H1>Scheduled Deployments</H1>
                    ${htm`<${showScheduledDeployments} metadata=${metadata}//>`}
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
