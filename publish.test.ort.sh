#/bin/bash

set +e

MSG3_TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiIsImp0aSI6ImQyZTYyNTI2MmI4ODFkZTY2ZWQyNjI3MDE3NjExNzJmYzU4YTFhMjkyNWNkNGZhYjE3NDg4MWNhNjFkMWQzMGVmZjEwOWUzNTRkYjYyMTYyIn0.eyJhdWQiOiJvYXV0aF9jbGllbnRzOjo1YTE1MjdjYjQwNDZjIiwianRpIjoiZDJlNjI1MjYyYjg4MWRlNjZlZDI2MjcwMTc2MTE3MmZjNThhMWEyOTI1Y2Q0ZmFiMTc0ODgxY2E2MWQxZDMwZWZmMTA5ZTM1NGRiNjIxNjIiLCJpYXQiOjE1MzQyMzk5NzgsIm5iZiI6MTUzNDIzOTk3OCwiZXhwIjoxNTY1Nzc1OTc4LCJzdWIiOiJ1c2Vyczo6NWExNTI3ZTFkZjE1ZiIsInNjb3BlcyI6WyJwcmVzZW50YXRpb24iXX0.iRbG6gUlH0V5RK8hPUZd9Wm4zNqlkc6taTfkw-zPzcel-_cDH1I3IgNBsoztoVBQO0Elp7DC2XzjPQNHCA55OCgX5MOo8MLaxAj2la2_7A9RcxHI1VTklbtmaErTUSH9klCcQcuKo8ZnGslRXpk3gsSKUmiLwrQ8bSCuoUJhcC_oxA48dcpg61ytqCYsJVDaUIgIj9lfP5R0g-zgx5IOc68P21F8Bj-Ad3gIJqHcmvQrP2iYh3IJF6a4RaGHhEN3msPh1XhkFRwm7K7_kdcnNKrGFPfbO9ImSFJYEARcPXt497jk_UnpXL0jWcavGeC9ooTZnvCkBEJjv7FGUm1e9M7UMvbS5rkrUEbAi7bofg4rNNCmnt9WEz70I6qvOhFjfWr0G9QtZ3hbA6f7sCpO-l9VU0nWY5HH_6lRpB9BDhWQh9YiKHZgR_OJiQqrNyLs_ROpmjVMZoVm5JMW9rIsxrIaTUWSM_hwlueqQ6e3a8RgZRh5Gqdt1l3gxv1C1QnnpBAZI3frSJVinXnlQrjZ55mlFaHNK89srrhUnVgvCBfPjgzEX0hO8U9hmF5gshl9W05wu_ghH70TZgjneFNwNjs_wuzVRabyHpZGC6payDECgN51uLFlXUiV7AJz5PXT-wdu9rUUEM5jyZUOvCYU2X-CWibNrSZGyjfb7gVgqXk"
MSG3_HOST="backend.my-salesguide-test.com"
MSG3_PRESENTATION="filemanager::5b5711638ac75"

cd `dirname $0`
mkdir -p dist;

npm run dev

cp dist/mySALESGUIDE.js example/presentation/
cd example/presentation/
zip -q -9 -r ../../dist/presentation.zip .
if [ "x${MSG3_PRESENTATION}" != "x" ]; then
    curl -q -s -X POST -H "Authorization: Bearer ${MSG3_TOKEN}" -F "file=@../../dist/presentation.zip" \
        "https://${MSG3_HOST}/api/v3.2/presentation/${MSG3_PRESENTATION}/update"
    exit $?
fi

exit 255
