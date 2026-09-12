# 한지민 UX 디자이너 독립 검증

## 전제

- 페르소나: 한지민, B2B 생산성 도구를 설계해 온 시니어 UX 디자이너. Figma 플러그인을 자주 사용하며, 구조를 학습하기보다 선택한 객체에서 바로 다음 행동을 찾는 편이다.
- Figma 숙련도: 상급
- 시간 압박: 20분 안에 회의용 로우파이 와이어프레임을 만들고 수정해야 함
- 작업 환경: 폭이 좁은 Figma Plugin Sidebar와 Canvas를 함께 사용
- 검증 방식: 현재 구현을 대상으로 한 구현 기반 인지적 워크스루. 실제 사용자 테스트나 시간 측정 결과가 아니다.
- 확인한 구현 범위: `Build`, `BuildNavigation`, `ScreenEditor`, `SectionEditor`, `ElementDetails`, `NodeList`, `BlockPicker`, element tree 유틸리티와 Plugin의 선택·생성 명령
- 독립성: 평가가 끝날 때까지 제품·개발 문서, 기존 `persona/` 결과와 다른 평가자의 결과를 확인하지 않았다.

## 핵심 과업

Screen 1의 직속 Button을 선택한 뒤 Screen 1로 돌아가고, 같은 Screen의 다른 Node로 이동해 편집한다.

| 단계               | 기대                                                  | 실제 결과                                                                            | 판정 |
| ------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------ | ---- |
| Button 선택        | Sidebar가 Button 편집에 집중한다                      | breadcrumb 아래에 `button details`와 Button 설정이 먼저 표시된다                     | 성공 |
| 최상위 Screen 복귀 | 현재 위치에서 Screen으로 가는 조작이 바로 보인다      | 상단 `Screen 1 / Button`의 `Screen 1`이 버튼이며 Screen 선택을 실행한다              | 성공 |
| 형제 확인          | Canvas에서 다시 찾지 않고 같은 부모의 Node를 발견한다 | Inspector 아래 `In Screen 1`에 같은 Screen 직속 Node가 이름과 타입으로 표시된다      | 성공 |
| 형제 이동          | 목록에서 다른 Node를 눌러 즉시 편집한다               | Node 버튼이 해당 Figma Node 선택과 포커스를 실행하고 Sidebar가 새 Inspector로 바뀐다 | 성공 |
| 현재 위치 식별     | 현재 Node와 이동 가능한 Node가 구분된다               | 현재 항목은 `aria-pressed`와 선택 배경으로 구분된다                                  | 성공 |

### 핵심 과업 판단

핵심 과업은 성공한다. `Screen 1 / Button`은 부모 복귀를, `In Screen 1`은 옆 Node 이동을 각각 담당해 역할도 이해 가능하다. 특히 Canvas에서 작은 Node를 다시 클릭하지 않아도 된다는 점이 생산성 도구에서 유효하다.

단, Button의 Feature 설정이 길어질수록 `In Screen 1`이 Inspector 아래로 밀린다. 사용자가 형제 이동 기능을 이미 알고 있지 않다면 스크롤 전에는 존재를 발견하지 못할 수 있다.

## 복잡 과업

Screen 아래 Section 1을 만들고, 그 안에 Section 2와 Section 3을 만든 뒤 각 Section에 요소를 추가한다. 이후 Section 2의 깊은 요소에서 Section 3의 요소로 이동하고 각각 편집한다.

| 단계                                     | 기대                                        | 실제 결과                                                                                                | 판정      |
| ---------------------------------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------- | --------- |
| Screen에서 Section 1 생성                | 생성 진입점이 Screen 편집보다 우선해 보인다 | Screen 이름·Purpose 다음에 `Add something` 블록 선택기가 노출된다                                        | 성공      |
| Section 1 안에 Section 2·3 생성          | 현재 Section에 무엇을 넣는지 명확하다       | Section 선택 시 `Add to section`이 나오며 두 번째 깊이까지 Section을 추가할 수 있다                      | 성공      |
| 과도한 중첩 방지                         | 허용되지 않는 선택은 사전에 숨긴다          | 두 번째 깊이 Section에서는 Section 항목이 필터링되고, Plugin 명령도 중첩을 검증한다                      | 성공      |
| 각 하위 Section에 요소 추가              | 대상 컨테이너를 잃지 않고 요소를 넣는다     | breadcrumb로 Section을 확인하고 `Add to section`에서 요소를 추가한다                                     | 성공      |
| 깊은 요소의 위치 이해                    | Screen부터 현재 요소까지 전체 맥락이 보인다 | `Screen / Section 1 / Section 2 / Element`가 재귀적으로 표시된다                                         | 성공      |
| Section 2 요소에서 Section 3 요소로 이동 | 다른 가지로 최소한의 우회만 한다            | breadcrumb에서 Section 1 선택 → `In Section 1`의 Section 3 선택 → Section 3 자식 선택의 3단계가 필요하다 | 부분 성공 |
| Section 2에서 Section 3으로 이동         | 같은 부모의 형제가 즉시 보여야 한다         | Section 2 선택 화면의 목록은 Section 2의 자식이며 Section 2의 형제인 Section 3은 나오지 않는다           | 부분 성공 |
| 편집 후 구조 이동 반복                   | 설정과 탐색을 번갈아 사용하기 쉽다          | 요소의 형제 목록은 Inspector 뒤에 위치해 설정이 길면 반복 이동 비용이 커진다                             | 부분 성공 |

### 복잡 과업 판단

제한된 깊이와 재귀 breadcrumb의 조합은 적절하다. `Screen → 큰 영역 → 작은 영역 → 요소` 정도의 로우파이 구조를 표현하면서 현재 위치도 복구할 수 있다. 세 번째 Section 중첩을 생성 UI와 명령 양쪽에서 막은 것도 오류 예방에 유효하다.

다만 현재 `Sibling navigation`은 요소에만 직접 적용된다. 선택 대상이 Section이면 `SectionEditor`가 그 Section의 자식 목록을 보여주므로, Section 2와 Section 3 사이 이동은 부모인 Section 1로 한 번 올라가야 한다. 구조적으로 일관된 sibling navigation이라기보다 “요소에서는 형제, Section에서는 자식”이라는 숨은 규칙이다.

## 발견 사항

### P1 · 긴 Inspector에서 형제 탐색이 발견되지 않을 수 있음

- 영향: Button의 동작·Case 설정이 길어질수록 같은 부모의 Node 목록이 fold 아래로 내려간다. 사용자는 새 기능을 모르기 때문에 Canvas를 다시 클릭하는 기존 행동으로 돌아갈 가능성이 높다.
- 근거: `Build`가 `ElementDetails`를 먼저 렌더링하고 그 뒤에 `NodeList`를 렌더링한다. `ElementDetails` 안에는 Button의 `FeatureDetails`도 포함된다.
- 제안: breadcrumb 바로 아래에 현재 컨테이너의 형제를 고르는 한 줄짜리 Select를 둔다. 기존 하단 목록을 위로 옮겨 중복시키기보다, 좁은 Sidebar에서 항상 접근 가능한 단일 탐색 컨트롤로 대체하는 편이 작고 명확하다.

### P1 · Section 선택에서 sibling이라는 탐색 규칙이 깨짐

- 영향: `Screen / Section 1 / Section 2`까지 왔을 때 Section 3이 같은 부모의 형제라는 사실을 Sidebar에서 즉시 볼 수 없다. 사용자는 Section 1을 눌러야 그 목록이 나온다는 계층 탐색 규칙을 스스로 추론해야 한다.
- 근거: 일반 요소는 `elementSiblings` 결과를 `NodeList`로 보여주지만, Section은 `SectionEditor`가 선택 Section의 직접 자식만 보여준다.
- 제안: 범용 Tree나 별도 탐색 화면을 만들지 말고 breadcrumb의 마지막 부모/현재 항목을 sibling Select로 만든다. 그러면 모든 깊이와 타입에서 같은 규칙으로 옆 이동이 가능하다.

### P2 · `In …`은 관계를 학습한 뒤에는 짧지만 최초 의미가 약함

- 영향: `In Screen 1`이 형제 목록인지 자식 목록인지 제목만으로 구분되지 않는다. 실제로 구현도 선택 타입에 따라 두 의미를 사용한다.
- 근거: 일반 요소 화면에서는 같은 부모의 형제 목록 제목이고, Section 화면에서는 선택한 Section의 자식 목록 제목이다.
- 제안: 하단 자식 목록은 `Inside {name}` 또는 `Contents`로, 형제 전환 컨트롤은 `Switch node in {name}`처럼 역할을 분리한다. 화면 공간을 줄이려면 시각 라벨은 짧게 유지하고 접근성 라벨에서 전체 의미를 제공한다.

### P2 · `+ Screen`은 위치상 Secondary지만 시각적 우선순위는 충분히 분리되지 않음

- 영향: Screen 편집에서 주요 과업은 요소 추가인데, `+ Screen`은 일반 버튼 스타일을 사용한다. 섹션이 아래에 있어 위치상 우선순위는 낮지만 조작 자체의 시각 무게는 여전히 크다.
- 근거: `NewScreen` 버튼에는 `secondaryAction` 스타일이 적용되지 않는다. `Add something`은 하나의 Primary CTA가 아니라 6개의 동일한 블록 버튼이다.
- 제안: 현재 배치는 유지한다. 실제 사용에서 오선택이 관찰될 때만 `+ Screen`을 secondary 스타일로 낮춘다. 지금 별도의 메뉴나 숨김 처리는 필요 없다.

### P2 · Section 안에서 새 요소 생성 후 선택 결과가 Screen 직속 생성과 다름

- 영향: Screen에 추가하면 새 Node가 선택되지만 Section에 추가하면 부모 Section이 계속 선택된다. 전자는 즉시 편집, 후자는 연속 추가에 유리해 사용자는 맥락에 따라 다른 결과를 경험한다.
- 근거: `insertBlock`은 부모가 없을 때 새 Node를 선택하고, 부모가 있으면 `parentNode`를 선택한다.
- 제안: 당장 변경하기보다 의도를 정한다. 로우파이 조립 속도가 목표라면 부모 선택 유지가 합리적이며, 방금 만든 요소는 목록에서 잠시 강조해 생성 피드백만 보완하는 것이 작다. 생성 직후 편집 성공률이 더 중요하다는 관찰이 생기면 새 Node 선택으로 통일한다.

### P3 · 현재 breadcrumb 항목이 버튼으로 반복 동작함

- 영향: 현재 선택 항목도 클릭 가능하지만 같은 선택을 다시 실행해 실질적 효용은 없다. 큰 문제는 아니며 키보드 Tab 정지점만 하나 늘어난다.
- 근거: 모든 path item을 동일한 버튼으로 렌더링하고 현재 항목에는 `aria-current`만 적용한다.
- 제안: 현재 항목은 텍스트로 렌더링하고 조상만 버튼으로 둔다. breadcrumb 의미도 더 선명해진다.

## 더 편한 최소 대안

전체 Layer Tree나 Sidebar 프레임워크를 더 확장할 필요는 없다. 현재 구조를 유지하면서 탐색 규칙 하나만 일관되게 만들면 된다.

```text
Screen 1 / Section 1 / [Section 2 ▾] / Button

Button details
...

Inside Section 2
Button
Input
```

- breadcrumb의 현재 깊이 항목 또는 그 바로 아래에 같은 부모의 sibling Select를 제공한다.
- breadcrumb의 조상은 그대로 상위 이동을 담당한다.
- 하단 목록은 선택된 컨테이너의 자식, 즉 `Inside …`만 담당한다.
- 요소의 긴 Inspector 아래에 별도 sibling 목록을 중복하지 않는다.

이 대안은 좁은 Sidebar에서 탐색을 fold 위에 유지하고, Section과 일반 요소의 이동 규칙을 통일한다. 새 Tree 모델, 검색, 접기 상태, drag-and-drop은 필요하지 않다.

## 최종 판정

- 판정: 부분 성공
- 장점: 선택 중심 Inspector, 재귀 breadcrumb, 제한된 Section 깊이, Screen에서 `Add something` 우선 배치는 현재 문제를 직접 해결한다. 핵심 과업은 명확하게 완료된다.
- 제한: sibling navigation이 Inspector 아래에 있어 긴 설정에서 발견성이 떨어지고, Section 선택에서는 sibling navigation이 제공되지 않아 복잡 과업의 가지 간 이동 규칙이 일관되지 않다.
- 권장 우선순위: (1) 모든 타입에 공통인 compact sibling 전환을 breadcrumb 인접 영역에 배치, (2) `In …`을 자식 목록 의미로 정리, (3) 실제 관찰 후 `+ Screen` 시각 강도와 생성 후 선택 정책 조정.
