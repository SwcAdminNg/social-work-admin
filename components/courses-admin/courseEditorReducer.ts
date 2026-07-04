import type {
  Course,
  CourseDetail,
  CourseItem,
  CourseQuiz,
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
  | { type: "SET_ITEM_QUIZ"; itemId: string; quiz: CourseQuiz }
  | { type: "ADD_QUIZ_QUESTION"; itemId: string; question: CourseQuizQuestion }
  | { type: "UPDATE_QUIZ_QUESTION"; questionId: string; fields: Partial<CourseQuizQuestion> }
  | { type: "REMOVE_QUIZ_QUESTION"; questionId: string }
  | { type: "ADD_QUIZ_OPTION"; questionId: string; option: CourseQuizOption }
  | { type: "UPDATE_QUIZ_OPTION"; optionId: string; fields: Partial<CourseQuizOption> }
  | { type: "REMOVE_QUIZ_OPTION"; optionId: string };

function mapSections(state: CourseDetail, fn: (section: CourseSection) => CourseSection): CourseDetail {
  return { ...state, sections: state.sections.map(fn) };
}

function mapItems(
  state: CourseDetail,
  fn: (item: CourseItem) => CourseItem
): CourseDetail {
  return mapSections(state, (section) => ({ ...section, items: section.items.map(fn) }));
}

function mapQuestion(item: CourseItem, questionId: string, fn: (q: CourseQuizQuestion) => CourseQuizQuestion): CourseItem {
  if (!item.quiz) return item;
  return {
    ...item,
    quiz: {
      ...item.quiz,
      questions: item.quiz.questions.map((q) => (q.id === questionId ? fn(q) : q)),
    },
  };
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
      if (item.item_type === "QUIZ" && !item.quiz) {
        item.quiz = {
          id: item.id,
          title: item.title,
          description: "",
          passing_score_percentage: 70,
          questions: [],
        };
      }
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

    case "SET_ITEM_QUIZ":
      return mapItems(state, (item) => (item.id === action.itemId ? { ...item, quiz: action.quiz } : item));

    case "ADD_QUIZ_QUESTION":
      return mapItems(state, (item) =>
        item.id === action.itemId && item.quiz
          ? { ...item, quiz: { ...item.quiz, questions: [...item.quiz.questions, action.question] } }
          : item
      );

    case "UPDATE_QUIZ_QUESTION":
      return mapItems(state, (item) =>
        item.quiz?.questions.some((q) => q.id === action.questionId)
          ? mapQuestion(item, action.questionId, (q) => ({ ...q, ...action.fields }))
          : item
      );

    case "REMOVE_QUIZ_QUESTION":
      return mapItems(state, (item) =>
        item.quiz
          ? { ...item, quiz: { ...item.quiz, questions: item.quiz.questions.filter((q) => q.id !== action.questionId) } }
          : item
      );

    case "ADD_QUIZ_OPTION":
      return mapItems(state, (item) =>
        item.quiz?.questions.some((q) => q.id === action.questionId)
          ? mapQuestion(item, action.questionId, (q) => ({ ...q, options: [...q.options, action.option] }))
          : item
      );

    case "UPDATE_QUIZ_OPTION":
      return mapItems(state, (item) => {
        if (!item.quiz) return item;
        return {
          ...item,
          quiz: {
            ...item.quiz,
            questions: item.quiz.questions.map((q) => ({
              ...q,
              options: q.options.map((o) => (o.id === action.optionId ? { ...o, ...action.fields } : o)),
            })),
          },
        };
      });

    case "REMOVE_QUIZ_OPTION":
      return mapItems(state, (item) => {
        if (!item.quiz) return item;
        return {
          ...item,
          quiz: {
            ...item.quiz,
            questions: item.quiz.questions.map((q) => ({
              ...q,
              options: q.options.filter((o) => o.id !== action.optionId),
            })),
          },
        };
      });

    default:
      return state;
  }
}

export function hasAnyCurriculumItem(course: CourseDetail): boolean {
  return course.sections.some((s) => s.items.length > 0);
}
