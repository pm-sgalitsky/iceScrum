%{--
- Copyright (c) 2015 Kagilum.
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
<script type="text/ng-template" id="sprint.new.html">
<div class="panel panel-light">
    <div class="panel-heading">
        <h3 class="panel-title row">
            <div class="left-title">
                <i class="fa fa-tasks"></i> <span class="item-name" title="${message(code: "todo.is.ui.sprint.new")}">${message(code: "todo.is.ui.sprint.new")}</span>
            </div>
            <div class="right-title">
                <details-layout-buttons ng-if="!isModal" remove-ancestor="true"/>
            </div>
        </h3>
    </div>
    <div class="details-no-tab">
        <div class="panel-body">
            <div class="help-block">${message(code: 'is.ui.sprint.help')}</div>
            <form ng-submit="save(sprint, false)"
                  name='formHolder.sprintForm'
                  show-validation
                  novalidate>
                <div class="form-group" ng-class="{'has-error': releaseEndDateWarning}">
                    <label for="sprint.parentRelease">${message(code: 'is.release')}</label>
                    <div class="input-group">
                        <ui-select class="form-control"
                                   ng-model="sprint.parentRelease"
                                   on-select="selectRelease(sprint.parentRelease)"
                                   required>
                            <ui-select-match>{{ $select.selected.name }}</ui-select-match>
                            <ui-select-choices repeat="editableRelease in editableReleases">{{ editableRelease.name }}</ui-select-choices>
                        </ui-select>
                        <span class="input-group-btn">
                            <a ui-sref="planning.release.details({releaseId: sprint.parentRelease.id})"
                               class="btn btn-default">
                                <i class="fa fa-info-circle"></i>
                            </a>
                        </span>
                    </div>
                    <div ng-if="releaseEndDateWarning"
                         class="help-block bg-danger spaced-help-block"
                         ng-bind-html="releaseEndDateWarning"></div>
                </div>
                <div class="clearfix no-padding">
                    <div class="form-half">
                        <label for="sprint.startDate">${message(code: 'is.sprint.startDate')}</label>
                        <div class="input-group">
                            <span class="input-group-btn">
                                <button type="button"
                                        class="btn btn-default"
                                        ng-click="openDatepicker($event, startDateOptions)">
                                    <i class="fa fa-calendar"></i>
                                </button>
                            </span>
                            <input type="text"
                                   class="form-control"
                                   required
                                   name="sprint.startDate"
                                   ng-model="sprint.startDate"
                                   ng-model-options="{timezone: 'utc'}"
                                   custom-validate="validateStartDate"
                                   custom-validate-code="is.ui.timebox.warning.dates"
                                   uib-datepicker-popup
                                   datepicker-options="startDateOptions"
                                   is-open="startDateOptions.opened"/>
                        </div>
                    </div>
                    <div class="form-half">
                        <label for="sprint.endDate" class="text-right">${message(code: 'is.sprint.endDate')}</label>
                        <div class="input-group">
                            <input type="text"
                                   class="form-control text-right"
                                   required
                                   name="sprint.endDate"
                                   ng-model="sprint.endDate"
                                   ng-model-options="{timezone: 'utc'}"
                                   custom-validate="validateEndDate"
                                   custom-validate-code="is.ui.timebox.warning.dates"
                                   uib-datepicker-popup
                                   datepicker-options="endDateOptions"
                                   is-open="endDateOptions.opened"/>
                            <span class="input-group-btn">
                                <button type="button"
                                        class="btn btn-default"
                                        ng-click="openDatepicker($event, endDateOptions)">
                                    <i class="fa fa-calendar"></i>
                                </button>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="btn-toolbar pull-right">
                    <button class="btn btn-primary"
                            ng-disabled="formHolder.sprintForm.$invalid || application.submitting"
                            defer-tooltip="${message(code: 'todo.is.ui.create.and.continue')} (SHIFT+RETURN)"
                            hotkey="{'shift+return': hotkeyClick }"
                            hotkey-allow-in="INPUT"
                            hotkey-description="${message(code: 'todo.is.ui.create.and.continue')}"
                            type='button'
                            ng-click="save(sprint, true)">
                        ${message(code: 'todo.is.ui.create.and.continue')}
                    </button>
                    <button class="btn btn-primary"
                            ng-disabled="formHolder.sprintForm.$invalid || application.submitting"
                            type="submit">
                        ${message(code: 'default.button.create.label')}
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
</script>
