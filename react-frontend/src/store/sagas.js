import { all, fork } from "redux-saga/effects"

import LayoutSaga from "./layout/saga"

export default function* rootSaga() {
  yield all([
    fork(LayoutSaga),
  ])
}
