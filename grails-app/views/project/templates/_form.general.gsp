<%@ page import="org.icescrum.core.domain.security.Authority; grails.plugin.springsecurity.SpringSecurityUtils; org.icescrum.core.support.ApplicationSupport" %>
%{--
- Copyright (c) 2014 Kagilum.
-
- This file is part of iceScrum.
-
- iceScrum is free software: you can redistribute it and/or modify
- it under the terms of the GNU Affero General Public License as published by
- the Free Software Foundation, either version 3 of the License.
-
- iceScrum is distributed in the hope that it will be useful,
- but WITHOUT ANY WARRANTY; without even the implied warranty of
- MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
- GNU General Public License for more details.
-
- You should have received a copy of the GNU Affero General Public License
- along with iceScrum.  If not, see <http://www.gnu.org/licenses/>.
-
- Authors:
-
- Vincent Barrier (vbarrier@kagilum.com)
- Nicolas Noullet (nnoullet@kagilum.com)
--}%
<script type="text/ng-template" id="form.general.project.html">
<h4>${message(code: "is.dialog.wizard.section.project")}</h4>
<p class="help-block spaced-help-block" ng-class="{'alert-warning': !project.preferences.hidden}">${message(code: 'is.dialog.wizard.section.project.description')}</p>
<entry:point id="project-form-general-before"/>
<div class="row">
    <div class="col-sm-8 col-xs-8 form-group">
        <label for="name">${message(code: 'is.project.name')}</label>
        <div class="input-group">
            <input autofocus
                   name="name"
                   type="text"
                   class="form-control"
                   placeholder="${message(code: 'todo.is.ui.project.noname')}"
                   ng-model="project.name"
                   ng-change="nameChanged()"
                   ng-required="isCurrentStep(1, 'project')">
            <span class="input-group-btn">
                <button class="btn btn-model"
                        type="button"
                        ng-disabled="!enableVisibilityChange()"
                        ng-model="project.preferences.hidden"
                        ng-click="project.preferences.hidden = !project.preferences.hidden;"
                        ng-class="project.preferences.hidden ? 'btn-success' : 'btn-danger'">
                    <i class="fa" ng-class="project.preferences.hidden ? 'fa-eye-slash' : 'fa-eye'"></i>
                    {{ message(project.preferences.hidden  ? 'is.ui.workspace.hidden' : 'is.ui.workspace.public') }}
                </button>
            </span>
        </div>
    </div>
    <div class="col-sm-4 col-xs-4 form-group">
        <label for="pkey">${message(code: 'is.project.pkey')}</label>
        <input name="pkey"
               type="text"
               capitalize
               class="form-control"
               placeholder="${message(code: 'todo.is.ui.project.nokey')}"
               ng-model="project.pkey"
               ng-pattern="/^[A-Z0-9]*[A-Z][A-Z0-9]*$/"
               pattern-error-message="${message(code: 'project.pkey.matches.invalid')}"
               ng-required="isCurrentStep(1, 'project')"
               ng-maxlength="10"
               ng-remote-validate-code="project.pkey.unique"
               ng-remote-validate="{{ checkProjectPropertyUrl }}/pkey">
    </div>
</div>
<div class="row">
    <div class="col-sm-12 form-group">
        <label for="description">${message(code: 'is.project.description')}</label>
        <textarea at
                  is-markitup
                  name="project.description"
                  class="form-control"
                  placeholder="${message(code: 'todo.is.ui.project.description.placeholder')}"
                  ng-model="project.description"
                  ng-show="showDescriptionTextarea"
                  ng-blur="delayCall(toggleDescription, [false])"
                  is-model-html="project.description_html"></textarea>
        <div class="markitup-preview"
             tabindex="0"
             ng-show="!showDescriptionTextarea"
             ng-click="toggleDescription(true)"
             ng-focus="toggleDescription(true)"
             ng-class="{'placeholder': !project.description_html}"
             ng-bind-html="project.description_html ? project.description_html : '<p>${message(code: 'todo.is.ui.project.description.placeholder')}</p>'"></div>
    </div>
</div>
</script>
