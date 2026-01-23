# GIT GUI - Adding Rebase Utility in GUI  


 1. Open C:\Program Files\Git\etc in your system
 2. Edit the gitconfig file 
 3. Add the following the code inside the gitconfig file along with the prev contents.



 ```bash
 [guitool "Rebase onto..."]
    cmd = git rebase $REVISION
    revprompt = yes
[guitool "Rebase/Continue"]
    cmd = git rebase --continue
[guitool "Rebase/Skip"]
    cmd = git rebase --skip
[guitool "Rebase/Abort"]
    cmd = git rebase --abort
[guitool "Pull with Rebase"]
    cmd = git pull --rebase
 ```