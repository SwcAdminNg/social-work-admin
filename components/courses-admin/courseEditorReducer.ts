import type {
  Course,
  CourseDetail,
  CourseItem,
  CourseAssessment,
  CourseQuizSettings,
  CourseQuizGroupSettings,
  CourseQuizGroupSection,
  CourseEssaySettings,
  CourseQuizOption,
  CourseQuizQuestion,
  CourseSection,
} from "@/lib/api/courses.types";

export type CourseEditorAction =
  | { type: "SET_COURSE"; course: CourseDetail }
  | { type: "UPDATE_COURSE_FIELDS"; fields: Partial<Course> }
  | { type: "SET_SECTIONS"; sections: CourseSection[] }
  | { type: "ADD_SECTION"; section: CourseSection }
  | { type: "UPDATE_SECTION"; sectionId: string; fields: Partial<CourseSection> }
  | { type: "REMOVE_SECTION"; sectionId: string }
  | { type: "SET_SECTION_ITEMS"; sectionId: string; items: CourseItem[] }
  | { type: "ADD_ITEM"; sectionId: string; item: CourseItem }
  | { type: "UPDATE_ITEM"; itemId: string; fields: Partial<CourseItem> }
  | { type: "REMOVE_ITEM"; itemId: string }
  | { type: "UPDATE_ASSESSMENT"; itemId: string; assessment: CourseAssessment }
  | { type: "ADD_QUIZ_QUESTION"; itemId: string; question: CourseQuizQuestion }
  | { type: "UPDATE_QUIZ_QUESTION"; questionId: string; fields: Partial<CourseQuizQuestion> }
  | { type: "REMOVE_QUIZ_QUESTION"; questionId: string }
  | { type: "ADD_QUIZ_OPTION"; questionId: string; option: CourseQuizOption }
  | { type: "UPDATE_QUIZ_OPTION"; optionId: string; fields: Partial<CourseQuizOption> }
  | { type: "REMOVE_QUIZ_OPTION"; optionId: string }
  | {
      type: "UPDATE_QUIZ_GROUP_SETTINGS";
      itemId: string;
      fields: Partial<Omit<CourseQuizGroupSettings, "sections">>;
    }
  | { type: "ADD_QUIZ_GROUP_SECTION"; itemId: string; section: CourseQuizGroupSection }
  | { type: "UPDATE_QUIZ_GROUP_SECTION"; sectionId: string; fields: Partial<CourseQuizGroupSection> }
  | { type: "REMOVE_QUIZ_GROUP_SECTION"; sectionId: string }
  | { type: "ADD_QUIZ_GROUP_SECTION_QUESTION"; sectionId: string; question: CourseQuizQuestion };

function mapSections(state: CourseDetail, fn: (section: CourseSection) => CourseSection): CourseDetail {
  return { ...state, sections: state.sections.map(fn) };
}

function mapItems(
  state: CourseDetail,
  fn: (item: CourseItem) => CourseItem
): CourseDetail {
  return mapSections(state, (section) => ({ ...section, items: section.items.map(fn) }));
}

// Question ids are unique across both a standalone quiz and a quiz group's section pools,
// so mutation actions dispatched by QuizQuestionCard search both containers to find where
// the question actually lives (it doesn't know which one it was rendered from).
function mapQuestion(item: CourseItem, questionId: string, fn: (q: CourseQuizQuestion) => CourseQuizQuestion): CourseItem {
  const assessment = item.assessment;
  if (!assessment) return item;

  if (assessment.quiz?.questions.some((q) => q.id === questionId)) {
    return {
      ...item,
      assessment: {
        ...assessment,
        quiz: {
          ...assessment.quiz,
          questions: assessment.quiz.questions.map((q) => (q.id === questionId ? fn(q) : q)),
        },
      },
    };
  }

  if (assessment.quiz_group?.sections.some((s) => s.questions.some((q) => q.id === questionId))) {
    return {
      ...item,
      assessment: {
        ...assessment,
        quiz_group: {
          ...assessment.quiz_group,
          sections: assessment.quiz_group.sections.map((s) =>
            s.questions.some((q) => q.id === questionId)
              ? { ...s, questions: s.questions.map((q) => (q.id === questionId ? fn(q) : q)) }
              : s
          ),
        },
      },
    };
  }

  return item;
}

function removeQuestion(item: CourseItem, questionId: string): CourseItem {
  const assessment = item.assessment;
  if (!assessment) return item;
  let next = assessment;

  if (assessment.quiz?.questions.some((q) => q.id === questionId)) {
    next = { ...next, quiz: { ...assessment.quiz, questions: assessment.quiz.questions.filter((q) => q.id !== questionId) } };
  }

  if (assessment.quiz_group?.sections.some((s) => s.questions.some((q) => q.id === questionId))) {
    next = {
      ...next,
      quiz_group: {
        ...assessment.quiz_group,
        sections: assessment.quiz_group.sections.map((s) => ({
          ...s,
          questions: s.questions.filter((q) => q.id !== questionId),
        })),
      },
    };
  }

  return next === assessment ? item : { ...item, assessment: next };
}

function mapAllQuestions(item: CourseItem, fn: (q: CourseQuizQuestion) => CourseQuizQuestion): CourseItem {
  const assessment = item.assessment;
  if (!assessment) return item;
  let next = assessment;

  if (assessment.quiz) {
    next = { ...next, quiz: { ...assessment.quiz, questions: assessment.quiz.questions.map(fn) } };
  }

  if (assessment.quiz_group) {
    next = {
      ...next,
      quiz_group: {
        ...assessment.quiz_group,
        sections: assessment.quiz_group.sections.map((s) => ({ ...s, questions: s.questions.map(fn) })),
      },
    };
  }

  return next === assessment ? item : { ...item, assessment: next };
}

export function courseEditorReducer(state: CourseDetail, action: CourseEditorAction): CourseDetail {
  switch (action.type) {
    case "SET_COURSE":
      return action.course;

    case "UPDATE_COURSE_FIELDS":
      return { ...state, ...action.fields };

    case "SET_SECTIONS":
      return { ...state, sections: action.sections };

    case "ADD_SECTION":
      return { ...state, sections: [...state.sections, action.section] };

    case "UPDATE_SECTION":
      return mapSections(state, (s) => (s.id === action.sectionId ? { ...s, ...action.fields } : s));

    case "REMOVE_SECTION":
      return { ...state, sections: state.sections.filter((s) => s.id !== action.sectionId) };

    case "SET_SECTION_ITEMS":
      return mapSections(state, (s) => (s.id === action.sectionId ? { ...s, items: action.items } : s));

    case "ADD_ITEM":
      const item = { ...action.item };
      return mapSections(state, (s) =>
        s.id === action.sectionId ? { ...s, items: [...s.items, item] } : s
      );

    case "UPDATE_ITEM":
      return mapItems(state, (item) => (item.id === action.itemId ? { ...item, ...action.fields } : item));

    case "REMOVE_ITEM":
      return mapSections(state, (s) => ({
        ...s,
        items: s.items.filter((i) => i.id !== action.itemId),
      }));

    case "UPDATE_ASSESSMENT":
      return mapItems(state, (item) => (item.id === action.itemId ? { ...item, assessment: action.assessment } : item));

    case "ADD_QUIZ_QUESTION":
      return mapItems(state, (item) =>
        item.id === action.itemId && item.assessment?.quiz
          ? {
              ...item,
              assessment: {
                ...item.assessment,
                quiz: {
                  ...item.assessment.quiz,
                  questions: [...item.assessment.quiz.questions, action.question],
                },
              },
            }
          : item
      );

    case "UPDATE_QUIZ_QUESTION":
      return mapItems(state, (item) => mapQuestion(item, action.questionId, (q) => ({ ...q, ...action.fields })));

    case "REMOVE_QUIZ_QUESTION":
      return mapItems(state, (item) => removeQuestion(item, action.questionId));

    case "ADD_QUIZ_OPTION":
      return mapItems(state, (item) =>
        mapQuestion(item, action.questionId, (q) => ({ ...q, options: [...q.options, action.option] }))
      );

    case "UPDATE_QUIZ_OPTION":
      return mapItems(state, (item) =>
        mapAllQuestions(item, (q) => ({
          ...q,
          options: q.options.map((o) => (o.id === action.optionId ? { ...o, ...action.fields } : o)),
        }))
      );

    case "REMOVE_QUIZ_OPTION":
      return mapItems(state, (item) =>
        mapAllQuestions(item, (q) => ({
          ...q,
          options: q.options.filter((o) => o.id !== action.optionId),
        }))
      );

    case "UPDATE_QUIZ_GROUP_SETTINGS":
      return mapItems(state, (item) =>
        item.id === action.itemId && item.assessment?.quiz_group
          ? {
              ...item,
              assessment: {
                ...item.assessment,
                quiz_group: { ...item.assessment.quiz_group, ...action.fields },
              },
            }
          : item
      );

    case "ADD_QUIZ_GROUP_SECTION":
      return mapItems(state, (item) =>
        item.id === action.itemId && item.assessment?.quiz_group
          ? {
              ...item,
              assessment: {
                ...item.assessment,
                quiz_group: {
                  ...item.assessment.quiz_group,
                  sections: [...item.assessment.quiz_group.sections, action.section],
                },
              },
            }
          : item
      );

    case "UPDATE_QUIZ_GROUP_SECTION":
      return mapItems(state, (item) =>
        item.assessment?.quiz_group?.sections.some((s) => s.id === action.sectionId)
          ? {
              ...item,
              assessment: {
                ...item.assessment,
                quiz_group: {
                  ...item.assessment.quiz_group,
                  sections: item.assessment.quiz_group.sections.map((s) =>
                    s.id === action.sectionId ? { ...s, ...action.fields } : s
                  ),
                },
              },
            }
          : item
      );

    case "REMOVE_QUIZ_GROUP_SECTION":
      return mapItems(state, (item) =>
        item.assessment?.quiz_group?.sections.some((s) => s.id === action.sectionId)
          ? {
              ...item,
              assessment: {
                ...item.assessment,
                quiz_group: {
                  ...item.assessment.quiz_group,
                  sections: item.assessment.quiz_group.sections.filter((s) => s.id !== action.sectionId),
                },
              },
            }
          : item
      );

    case "ADD_QUIZ_GROUP_SECTION_QUESTION":
      return mapItems(state, (item) =>
        item.assessment?.quiz_group?.sections.some((s) => s.id === action.sectionId)
          ? {
              ...item,
              assessment: {
                ...item.assessment,
                quiz_group: {
                  ...item.assessment.quiz_group,
                  sections: item.assessment.quiz_group.sections.map((s) =>
                    s.id === action.sectionId ? { ...s, questions: [...s.questions, action.question] } : s
                  ),
                },
              },
            }
          : item
      );

    default:
      return state;
  }
}

export function hasAnyCurriculumItem(course: CourseDetail): boolean {
  return course.sections.some((s) => s.items.length > 0);
}
