%{--
- Copyright (c) 2014 Kagilum SAS.
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
<is:modal size="sm"
          title="${message(code: 'is.dialog.login')}"
          submitButton="${message(code: 'is.button.connect')}"
          closeButton="${message(code: 'is.button.cancel')}"
          autoFillFix="true"
          form="login(credentials)">
    <div class="form-group">
        <label for="credentials.j_username">
            <small class="pull-right text-muted" ng-click="$close(); showRegisterModal()">${message(code: 'is.button.register')}</small>
            <div>${message(code: 'is.dialog.login.username.or.email')}</div>
        </label>
        <input required
               ng-model="credentials.j_username"
               type="text"
               name="is_username"
               id="credentials.j_username"
               class="form-control"
               autofocus
               value="${params.username ?: ''}">
    </div>
    <div class="form-group">
        <label for="credentials.j_password">
            <small class="pull-right text-muted" ng-click="showRetrieveModal()">${message(code: 'is.dialog.retrieve')}</small>
            <div>${message(code: 'is.user.password')}</div>
        </label>
        <input required
               ng-model="credentials.j_password"
               type="password"
               name="is_password"
               id="credentials.j_password"
               class="form-control"
               value="">
    </div>
    <div class="checkbox">
        <label for="credentials.remember_me">
            <input type="checkbox"
                   ng-model="credentials.${rememberMeParameter}"
                   name="${rememberMeParameter}"
                   id="credentials.remember_me"/>
            ${message(code: 'is.dialog.login.rememberme')}
        </label>
    </div>
</is:modal>