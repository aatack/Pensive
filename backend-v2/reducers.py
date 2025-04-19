from helpers import Json


def replace(_: Json, update: Json) -> Json:
    return update


def array(current: Json, update: Json) -> Json:
    if not isinstance(update, str) or len(update) < 1:
        return current

    operation, text = update[0], update[1:]

    if not isinstance(current, list):
        current = []

    present = text in current
    if operation == "+" and not present:
        return current + [text]
    elif operation == "-" and present:
        return [item for item in current if item != text]
    elif (
        operation == ">"
        and present
        and (index := current.index(text) < len(current) - 1)
    ):
        current[index], current[index + 1] = current[index + 1], current[index]
        return current
    elif operation == "<" and present and (index := current.index(text) > 0):
        current[index], current[index - 1] = current[index - 1], current[index]
        return current
