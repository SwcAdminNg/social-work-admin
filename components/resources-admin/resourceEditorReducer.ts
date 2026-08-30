import type { Resource, ResourceManageDetail, ResourceAttachment } from "@/lib/api/resources.types";

export type ResourceEditorAction =
  | { type: "SET_RESOURCE"; resource: ResourceManageDetail }
  | { type: "UPDATE_RESOURCE_FIELDS"; fields: Partial<Resource> }
  | { type: "SET_ATTACHMENTS"; attachments: ResourceAttachment[] }
  | { type: "ADD_ATTACHMENT"; attachment: ResourceAttachment }
  | { type: "UPDATE_ATTACHMENT"; attachmentId: string; fields: Partial<ResourceAttachment> }
  | { type: "REMOVE_ATTACHMENT"; attachmentId: string };

export function resourceEditorReducer(
  state: ResourceManageDetail,
  action: ResourceEditorAction
): ResourceManageDetail {
  switch (action.type) {
    case "SET_RESOURCE":
      return action.resource;

    case "UPDATE_RESOURCE_FIELDS":
      return { ...state, ...action.fields };

    case "SET_ATTACHMENTS":
      return { ...state, attachments: action.attachments };

    case "ADD_ATTACHMENT":
      return { ...state, attachments: [...state.attachments, action.attachment] };

    case "UPDATE_ATTACHMENT":
      return {
        ...state,
        attachments: state.attachments.map((a) =>
          a.id === action.attachmentId ? { ...a, ...action.fields } : a
        ),
      };

    case "REMOVE_ATTACHMENT":
      return {
        ...state,
        attachments: state.attachments.filter((a) => a.id !== action.attachmentId),
      };

    default:
      return state;
  }
}
