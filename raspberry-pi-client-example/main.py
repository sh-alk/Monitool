from monitools_client import MonitoolsClient


client = MonitoolsClient(api_url="https://be-monitool.turnrow.online", api_key="as12388kdjalsur12o12nr;3mt1")


technicians = client.get_all_technicians()
toolboxes = client.get_all_toolboxes()

first_technicaion = technicians[0]
first_toolbox = toolboxes[0]

print(first_technicaion, first_toolbox)
breakpoint()


response = client.log_access(first_toolbox['id'], first_technicaion['id'], "open", notes="added through my simple library")
toolbox = client.get_toolbox('random_id')
print(toolbox)
print(response)
