import { Injectable } from '@angular/core';
import {
  CreateIssueGQL,
  CreateIssueMutationVariables,
  FindProjectBySlugGQL,
  ProjectDto,
  ProjectIssueDto,
  ReorderIssuesGQL,
  ProjectLaneDto,
} from '@trungk18/core/graphql/service/graphql';
import { JComment } from '@trungk18/interface/comment';
import { FetchResult } from 'apollo-link';
import { Observable } from 'rxjs';
import { finalize, tap } from 'rxjs/operators';
import { ProjectStore } from './project.store';
import { environment } from 'apps/jira-clone/src/environments/environment';
import { setLoading, arrayUpsert } from '@datorama/akita';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  baseUrl: string;

  constructor(
    private _store: ProjectStore,
    private _findProjectBySlugGql: FindProjectBySlugGQL,
    private _createIssueGql: CreateIssueGQL,
    private reorderIssueGql: ReorderIssuesGQL,
  ) {
    this.baseUrl = environment.apiUrl;
  }

  setLoading(isLoading: boolean) {
    this._store.setLoading(isLoading);
  }

  getProject(slug: string): Observable<FetchResult> {
    this.setLoading(true);
    return this._findProjectBySlugGql
      .fetch({
        slug,
      })
      .pipe(
        tap((res) => {
          let project: any = res.data.findProjectBySlug;
          this._store.update((state) => {
            let newState = {
              ...state,
              ...project,
            };
            console.log(newState);
            return newState;
          });
        }),
        finalize(() => {
          this.setLoading(false);
        }),
      );
  }

  updateProject(project: Partial<ProjectDto>) {
    this._store.update((state) => ({
      ...state,
      ...project,
    }));
  }

  createIssue(issueInput: CreateIssueMutationVariables) {
    let input: CreateIssueMutationVariables = {
      ...issueInput,
      projectId: this._store.getValue().id,
    };
    return this._createIssueGql.mutate(input).pipe(
      tap(({ data }) => {
        this._store.update({});
      }),
    );
  }

  reorderIssues(laneId: string, issues: string[]) {
    return this.reorderIssueGql
      .mutate({
        laneId,
        projectId: this._store.getValue().id,
        issues,
      })
      .pipe(
        setLoading(this._store),
        tap(({ data }) => {
          this.updateProject(<any>data.reorderIssueInLane);
        }),
      );
  }

  updateIssue(issue: ProjectIssueDto) {
    // issue.updatedAt = DateUtil.getNow();
    // this._store.update((state) => {
    //   let issues = arrayUpsert(state.issues, issue.id, issue);
    //   return {
    //     ...state,
    //     issues
    //   };
    // });
  }

  deleteIssue(issueId: string) {
    // this._store.update((state) => {
    //   let issues = arrayRemove(state.issues, issueId);
    //   return {
    //     ...state,
    //     issues
    //   };
    // });
  }

  updateIssueComment(issueId: string, comment: JComment) {
    // let allIssues = this._store.getValue().issues;
    // let issue = allIssues.find((x) => x.id === issueId);
    // if (!issue) {
    //   return;
    // }
    // let comments = arrayUpsert(issue.comments ?? [], comment.id, comment);
    // this.updateIssue({
    //   ...issue,
    //   comments
    // });
  }
}
