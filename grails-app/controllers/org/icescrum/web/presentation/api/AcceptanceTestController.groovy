/*
 * Copyright (c) 2014 Kagilum SAS
 *
 * This file is part of iceScrum.
 *
 * iceScrum is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License.
 *
 * iceScrum is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with iceScrum.  If not, see <http://www.gnu.org/licenses/>.
 *
 * Authors:
 *
 * Vincent Barrier (vbarrier@kagilum.com)
 * Nicolas Noullet (nnoullet@kagilum.com)
 *
 */

package org.icescrum.web.presentation.api

import grails.converters.JSON
import grails.plugin.springsecurity.annotation.Secured
import org.icescrum.core.domain.AcceptanceTest
import org.icescrum.core.domain.Project
import org.icescrum.core.domain.Story
import org.icescrum.core.domain.User
import org.icescrum.core.error.ControllerErrorHandler

class AcceptanceTestController implements ControllerErrorHandler {

    def springSecurityService
    def acceptanceTestService

    @Secured('(stakeHolder() or inProject()) and !archivedProject()')
    def index(long project) {
        def acceptanceTests
        def term = params.term ?: ''
        def state = params.state ? [params.int('state')] : []
        if (params.parentStory) {
            acceptanceTests = AcceptanceTest.getAllInStory(project, params.long('parentStory'), term, state)
        } else if (params.parentSprint) {
            acceptanceTests = AcceptanceTest.getAllInSprint(project, params.long('parentSprint'), term, state)
        } else {
            acceptanceTests = AcceptanceTest.getAllInProject(project, term, state)
        }
        render(status: 200, contentType: 'application/json', text: acceptanceTests as JSON)
    }

    @Secured('(stakeHolder() or inProject()) and !archivedProject()')
    def show(long id, long project) {
        AcceptanceTest acceptanceTest = AcceptanceTest.withAcceptanceTest(project, id)
        render(status: 200, contentType: 'application/json', text: acceptanceTest as JSON)
    }

    @Secured('inProject() and !archivedProject()')
    def save(long project) {
        def acceptanceTestParams = params.acceptanceTest
        if (!acceptanceTestParams) {
            returnError(code: 'todo.is.ui.no.data')
            return
        }
        def story = Story.withStory(project, acceptanceTestParams.parentStory.id.toLong())
        Project _project = ((Project) story.backlog)
        if (story.state >= Story.STATE_DONE) {
            returnError(code: 'is.acceptanceTest.error.save.storyState', args: [message(code: _project.getStoryStateNames()[Story.STATE_DONE])])
            return
        }
        def state = acceptanceTestParams.state?.toInteger()
        def newState
        if (state != null) {
            if (AcceptanceTest.AcceptanceTestState.exists(state)) {
                newState = AcceptanceTest.AcceptanceTestState.byId(state)
                if (newState > AcceptanceTest.AcceptanceTestState.TOCHECK && !(story.state in [Story.STATE_INPROGRESS, Story.STATE_INREVIEW])) {
                    returnError(code: 'is.acceptanceTest.error.update.state.storyState', args: [message(code: _project.getStoryStateNames()[Story.STATE_INPROGRESS])])
                    return
                }
            } else {
                returnError(text: "Error: the provided acceptance test state doesn't exist.")
                return
            }
        }
        User user = (User) springSecurityService.currentUser
        def acceptanceTest = new AcceptanceTest()
        AcceptanceTest.withTransaction {
            if (newState) {
                acceptanceTest.stateEnum = newState
            }
            bindData(acceptanceTest, acceptanceTestParams, [include: ['name', 'description']])
            acceptanceTestService.save(acceptanceTest, story, user)
        }
        render(status: 201, contentType: 'application/json', text: acceptanceTest as JSON)
    }

    @Secured('inProject() and !archivedProject()')
    def update(long id, long project) {
        def acceptanceTestParams = params.acceptanceTest
        if (!acceptanceTestParams) {
            returnError(code: 'todo.is.ui.no.data')
            return
        }
        AcceptanceTest acceptanceTest = AcceptanceTest.withAcceptanceTest(project, id)
        def story = acceptanceTest.parentStory
        if (story.state >= Story.STATE_DONE) {
            returnError(code: 'is.acceptanceTest.error.update.storyState')
            return
        }
        def state = acceptanceTestParams.state?.toInteger()
        def newState
        if (state != null) {
            if (AcceptanceTest.AcceptanceTestState.exists(state)) {
                newState = AcceptanceTest.AcceptanceTestState.byId(state)
                if (newState > AcceptanceTest.AcceptanceTestState.TOCHECK && !(story.state in [Story.STATE_INPROGRESS, Story.STATE_INREVIEW])) {
                    returnError(code: 'is.acceptanceTest.error.update.state.storyState', args: [message(code: ((Project) story.backlog).getStoryStateNames()[Story.STATE_INPROGRESS])])
                    return
                }
            } else {
                returnError(text: "Error: the provided acceptance test state doesn't exist.")
                return
            }
        }
        def props = [:]
        Integer rank = acceptanceTestParams.rank instanceof String ? acceptanceTestParams.rank.toInteger() : acceptanceTestParams.rank
        if (rank != null) {
            props.rank = rank
        }
        AcceptanceTest.withTransaction {
            if (newState) {
                acceptanceTest.stateEnum = newState
            }
            bindData(acceptanceTest, acceptanceTestParams, [include: ['name', 'description']])
            acceptanceTestService.update(acceptanceTest, props)
        }
        render(status: 200, contentType: 'application/json', text: acceptanceTest as JSON)
    }

    @Secured('inProject() and !archivedProject()')
    def delete(long id, long project) {
        AcceptanceTest acceptanceTest = AcceptanceTest.withAcceptanceTest(project, id)
        def deleted = [id: acceptanceTest.id, parentStory: [id: acceptanceTest.parentStory.id]]
        acceptanceTestService.delete(acceptanceTest)
        withFormat {
            html {
                render(status: 200, contentType: 'application/json', text: deleted as JSON)
            }
            json {
                render(status: 204)
            }
        }
    }

    @Secured('inProject() and !archivedProject()')
    def copy(long id, long project) {
        AcceptanceTest acceptanceTest = AcceptanceTest.withAcceptanceTest(project, id)
        Story story = acceptanceTest.parentStory
        if (story.state >= Story.STATE_DONE) {
            returnError(code: 'is.acceptanceTest.error.save.storyState', args: [message(code: ((Project) story.backlog).getStoryStateNames()[Story.STATE_DONE])])
            return
        }
        def copiedAcceptanceTest = acceptanceTestService.copy(acceptanceTest, (User) springSecurityService.currentUser)
        render(status: 200, contentType: 'application/json', text: copiedAcceptanceTest as JSON)
    }
}
